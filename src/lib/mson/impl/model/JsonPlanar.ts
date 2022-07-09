import { JsonArray, JsonObject } from '@keupoz/tson'
import { Vector3 } from 'three'
import { Identifier } from '../../../minecraft/Identifier'
import { Quad, QuadGeometry } from '../../../QuadGeometry'
import { Tuple2, Tuple3 } from '../../../Tuple'
import { Incomplete } from '../../api/Incomplete'
import { JsonContext } from '../../api/json/JsonContext'
import { BoxBuilder } from '../../api/model/BoxBuilder'
import { CoordinateFixture } from '../../api/model/CoordinateFixture'
import { Axis, Face } from '../../api/model/Face'
import { PartBuilder } from '../../api/model/PartBuilder'
import { QuadsBuilder } from '../../api/model/QuadsBuilder'
import { Texture } from '../../api/model/Texture'
import { ModelContext } from '../../api/ModelContext'
import { accept } from '../../util/JsonUtil'
import { JsonCompound } from './JsonCompound'
import { fromParent } from './JsonTexture'

export class JsonPlanar extends JsonCompound {
  public static override readonly ID = new Identifier('mson', 'planar')

  private readonly faces: Map<Face, JsonFaceSet>

  constructor (context: JsonContext, name: string, json: JsonObject) {
    super(context, name, json)

    this.faces = new Map()

    for (const face of Face.values()) {
      const rawFaceSet = accept(json, face.getName().toLowerCase())

      if (rawFaceSet !== null) {
        this.faces.set(face, new JsonFaceSet(context, rawFaceSet.getAsArray(), face))
      }
    }
  }

  protected override exportChildren (context: ModelContext, builder: PartBuilder): PartBuilder {
    super.exportChildren(context, builder)

    const quads: Quad[] = []

    for (const faceSet of this.faces.values()) {
      quads.push(...faceSet.export(context))
    }

    builder.addCube(new QuadGeometry(quads))

    return builder
  }
}

class JsonFaceSet {
  private readonly face: Face

  private readonly elements: Set<JsonFace>

  constructor (context: JsonContext, json: JsonArray, face: Face) {
    this.face = face
    this.elements = new Set()

    if (json.get(0).isArray()) {
      for (const element of json.iterator()) {
        this.elements.add(new JsonFace(context, element.getAsArray(), face))
      }
    } else {
      this.elements.add(new JsonFace(context, json, face))
    }
  }

  public * export (subContext: ModelContext): IterableIterator<Quad> {
    const fixtures = new Fixtures(subContext, this.face, this.elements)

    for (const element of this.elements) {
      yield * element.export(subContext, fixtures)
    }
  }
}

class JsonFace {
  private readonly face: Face

  public readonly position: Incomplete<Tuple3<number>>
  public readonly size: Incomplete<Tuple2<number>>

  private readonly texture: Incomplete<Texture>

  private readonly mirror: Tuple2<boolean>

  constructor (context: JsonContext, json: JsonArray, face: Face) {
    this.face = face

    this.position = context.getLocals().getPrimitives<3>(
      json.get(0).getAsPrimitive(),
      json.get(1).getAsPrimitive(),
      json.get(2).getAsPrimitive()
    )

    this.size = context.getLocals().getPrimitives<2>(
      json.get(3).getAsPrimitive(),
      json.get(4).getAsPrimitive()
    )

    if (json.size() > 6) {
      this.texture = JsonFace.createTexture(
        context.getLocals().getPrimitive(json.get(5).getAsPrimitive()),
        context.getLocals().getPrimitive(json.get(6).getAsPrimitive())
      )
    } else {
      this.texture = fromParent
    }

    if (json.size() > 8) {
      this.mirror = [
        json.get(7).getAsBoolean(),
        json.get(8).getAsBoolean()
      ]
    } else {
      this.mirror = [false, false]
    }
  }

  public export (context: ModelContext, fixtures: Fixtures): Quad[] {
    return new BoxBuilder(context)
      .setFixture(fixtures)
      .setTexture(this.texture.resolve(context))
      .setMirror(this.face.getAxis(), this.mirror)
      .setPosition(this.position.resolve(context))
      .setSizeAxis(this.face.getAxis(), this.size.resolve(context))
      .buildQuads(QuadsBuilder.plane(this.face))
  }

  private static createTexture (u: Incomplete<number>, v: Incomplete<number>): Incomplete<Texture> {
    return Incomplete.create((locals) => {
      const parent = locals.getTexture()

      return new Texture(
        u.complete(locals),
        v.complete(locals),
        parent.getWidth(),
        parent.getHeight()
      )
    })
  }
}

class Fixtures extends CoordinateFixture {
  private readonly lockedVectors: Map<Axis, Vector3[]>

  constructor (context: ModelContext, face: Face, elements: Set<JsonFace>) {
    super()

    this.lockedVectors = new Map()

    for (const axis of Axis.getValues()) {
      if (axis !== face.getAxis()) {
        for (const i of elements) {
          const vertices = face.getVertices(i.position.resolve(context), i.size.resolve(context), axis, 0.5)

          for (const vertex of vertices) {
            const locked: Vector3[] = this.getLockedVectors(axis)

            for (const vector of locked) {
              if (vector.equals(vertex.getNormalVector())) return
            }

            for (const f of elements) {
              if (i !== f && face.isInside(f.position.resolve(context), f.size.resolve(context), vertex.getStretchedVector())) {
                locked.push(vertex.getNormalVector())
                break
              }
            }
          }
        }
      }
    }
  }

  public getLockedVectors (axis: Axis): Vector3[] {
    let result = this.lockedVectors.get(axis)

    if (result === undefined) {
      result = []
      this.lockedVectors.set(axis, result)
    }

    return result
  }

  protected override isFixed (axis: Axis, x: number, y: number, z: number): boolean {
    const locked = this.getLockedVectors(axis)
    const target = new Vector3(x, y, z)

    for (const vector of locked) {
      if (vector.equals(target)) return true
    }

    return false
  }
}
