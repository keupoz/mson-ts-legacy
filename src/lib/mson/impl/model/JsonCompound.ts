import { JsonElement, JsonObject } from '@keupoz/tson'
import { Identifier } from '../../../minecraft/Identifier'
import { ModelPart } from '../../../ModelPart'
import { QuadGeometry } from '../../../QuadGeometry'
import { Tuple3 } from '../../../Tuple'
import { Incomplete } from '../../api/Incomplete'
import { JsonComponent } from '../../api/json/JsonComponent'
import { JsonContext } from '../../api/json/JsonContext'
import { PartBuilder } from '../../api/model/PartBuilder'
import { Texture } from '../../api/model/Texture'
import { ModelContext, ModelContextLocals } from '../../api/ModelContext'
import { accept, acceptBooleans, getBooleanOr } from '../../util/JsonUtil'
import { JsonBox } from './JsonBox'
import { incompleteTexture } from './JsonTexture'

const DEG2RAD = Math.PI / 180

function * parseChildren (context: JsonContext, json: JsonElement | null): IterableIterator<[string, JsonComponent]> {
  if (json !== null) {
    for (const [key, value] of json.getAsObject().entries()) {
      const component = context.loadComponent(key, value, JsonCompound.ID)

      if (component !== null) {
        yield [key, component]
      }
    }
  }
}

function * parseCubes (context: JsonContext, json: JsonElement | null): IterableIterator<JsonComponent> {
  if (json !== null) {
    for (const value of json.getAsArray().iterator()) {
      const component = context.loadComponent('', value, JsonBox.ID)

      if (component !== null) {
        yield component
      }
    }
  }
}

export class JsonCompound extends JsonComponent {
  public static readonly ID = new Identifier('mson', 'compound')

  private readonly pivot: Incomplete<Tuple3<number>>
  public readonly dilation: Incomplete<Tuple3<number>>
  private readonly rotation: Incomplete<Tuple3<number>>
  private readonly mirror: Tuple3<boolean>
  private readonly visible: boolean

  private readonly children: Map<string, JsonComponent>
  private readonly cubes: Set<JsonComponent>

  public readonly texture: Incomplete<Texture>

  private readonly name: string

  constructor (context: JsonContext, name: string, json: JsonObject) {
    super()

    this.pivot = context.getLocals().getMemberArray(json, 'pivot', 3)
    this.dilation = context.getLocals().getMemberArray(json, 'dilate', 3)
    this.rotation = context.getLocals().getMemberArray(json, 'rotate', 3)

    this.mirror = [false, false, false]
    acceptBooleans(json, 'mirror', this.mirror)

    this.visible = getBooleanOr(json, 'visible', true)
    this.texture = incompleteTexture(accept(json, 'texture'))
    this.name = name

    if (name.length === 0) {
      const rawName = accept(json, 'name')

      if (rawName !== null) {
        this.name = rawName.getAsString()
      }
    }

    this.children = new Map(parseChildren(context, accept(json, 'children')))
    this.cubes = new Set(parseCubes(context, accept(json, 'cubes')))
  }

  public export (context: ModelContext): ModelPart {
    return context.computeIfAbsent(this.name, () => {
      const builder = new PartBuilder()
      const subContext = context.resolve(builder, new Locals(context.getLocals(), this))

      const result = this.exportChildren(subContext, builder).build()

      result.name = this.name

      return result
    })
  }

  protected exportChildren (context: ModelContext, builder: PartBuilder): PartBuilder {
    const rotation = this.rotation.resolve(context)

    builder
      .setHidden(!this.visible)
      .setPivot(this.pivot.resolve(context))
      .setMirror(this.mirror)
      .setRotation([
        rotation[0] * DEG2RAD,
        rotation[1] * DEG2RAD,
        rotation[2] * DEG2RAD
      ])
      .setTexture(this.texture.resolve(context))

    for (const [name, child] of this.children) {
      const result = child.tryExport(context, ModelPart)

      if (result !== null) {
        result.name = name
        builder.addChild(name, result)
      }
    }

    for (const cube of this.cubes) {
      const result = cube.tryExport(context, QuadGeometry)

      if (result !== null) {
        builder.addCube(result)
      }
    }

    return builder
  }
}

class Locals implements ModelContextLocals {
  private readonly parent: ModelContextLocals
  private readonly component: JsonCompound

  constructor (parent: ModelContextLocals, component: JsonCompound) {
    this.parent = parent
    this.component = component
  }

  public getModelId (): Identifier {
    return this.parent.getModelId()
  }

  public getDilation (): Tuple3<number> {
    const inherited = this.parent.getDilation()
    const dilation = this.component.dilation.complete(this.parent)
    return [
      inherited[0] + dilation[0],
      inherited[1] + dilation[1],
      inherited[2] + dilation[2]
    ]
  }

  public getTexture (): Texture {
    return this.component.texture.complete(this.parent)
  }

  public getLocal (name: string): number {
    return this.parent.getLocal(name)
  }

  public keys (): Set<string> {
    return this.parent.keys()
  }
}
