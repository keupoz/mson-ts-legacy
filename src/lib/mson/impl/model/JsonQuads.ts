import { JsonElement, JsonObject } from '@keupoz/tson'
import { Identifier } from '../../../minecraft/Identifier'
import { Quad, QuadGeometry, Vertex, VertexTuple } from '../../../QuadGeometry'
import { JsonComponent } from '../../api/json/JsonComponent'
import { JsonContext } from '../../api/json/JsonContext'
import { BoxBuilder } from '../../api/model/BoxBuilder'
import { QuadsBuilder } from '../../api/model/QuadsBuilder'
import { ModelContext } from '../../api/ModelContext'
import { getIntegerOr, getNumberOr, jsonRequire } from '../../util/JsonUtil'

export class JsonQuads extends JsonComponent {
  public static readonly ID = new Identifier('mson', 'quads')

  private readonly quads = new Set<JsonQuad>()

  private readonly texU: number
  private readonly texV: number

  private readonly builder: QuadsBuilder

  constructor (context: JsonContext, _name: string, json: JsonObject) {
    super()

    const callerStack = [JsonQuads.ID, context.getLocals().getModelId()]

    this.texU = jsonRequire(json, 'u', ...callerStack).getAsInteger()
    this.texV = jsonRequire(json, 'v', ...callerStack).getAsInteger()

    const rawVertices = jsonRequire(json, 'vertices', ...callerStack).getAsArray()
    const rawQuads = jsonRequire(json, 'faces', ...callerStack).getAsArray()

    const vertices: JsonVertex[] = []

    for (const rawVertex of rawVertices.iterator()) {
      vertices.push(new JsonVertex(rawVertex))
    }

    for (const rawQuad of rawQuads.iterator()) {
      this.quads.add(new JsonQuad(context, vertices, rawQuad))
    }

    this.builder = QuadsBuilder.create((ctx) => {
      const quads: Quad[] = []

      for (const quad of this.quads) {
        quads.push(quad.build(ctx))
      }

      return quads
    })
  }

  public export (context: ModelContext): QuadGeometry {
    const builder = new BoxBuilder(context)
    builder.u = this.texU
    builder.v = this.texV
    return builder.build('', this.builder)
  }
}

class JsonQuad {
  private readonly x: number
  private readonly y: number

  private readonly w: number
  private readonly h: number

  private readonly vertices: JsonVertex[]

  constructor (context: JsonContext, vertices: JsonVertex[], json: JsonElement) {
    const o = json.getAsObject()

    this.x = getIntegerOr(o, 'x', 0)
    this.y = getIntegerOr(o, 'y', 0)
    this.w = getIntegerOr(o, 'w', 0)
    this.h = getIntegerOr(o, 'h', 0)

    this.vertices = []

    const callerStack = [JsonQuads.ID, context.getLocals().getModelId()]
    const vertIndices = jsonRequire(o, 'vertices', ...callerStack).getAsArray()

    for (const index of vertIndices.iterator()) {
      const i = index.getAsInteger()
      const vertex = vertices[i]

      if (vertex === undefined) {
        throw new Error(`No vertex with the index ${i}`)
      }

      this.vertices.push(vertex)
    }
  }

  public build (builder: BoxBuilder): Quad {
    const vertices: VertexTuple = [
      Vertex.create(0, 0, 0, 0, 0),
      Vertex.create(0, 0, 0, 0, 0),
      Vertex.create(0, 0, 0, 0, 0),
      Vertex.create(0, 0, 0, 0, 0)
    ]

    this.vertices.forEach((vertex, i) => {
      vertices[i] = vertex.build()
    })

    return builder.quad(vertices, this.x, this.y, this.w, this.h)
  }
}

class JsonVertex {
  private readonly x: number
  private readonly y: number
  private readonly z: number

  private readonly u: number
  private readonly v: number

  constructor (json: JsonElement) {
    if (json.isArray()) {
      this.x = json.get(0).getAsNumber()
      this.y = json.get(1).getAsNumber()
      this.z = json.get(2).getAsNumber()
      this.u = json.get(3).getAsInteger()
      this.v = json.get(4).getAsInteger()
    } else {
      const o = json.getAsObject()

      this.x = getNumberOr(o, 'x', 0)
      this.y = getNumberOr(o, 'y', 0)
      this.z = getNumberOr(o, 'z', 0)
      this.u = getIntegerOr(o, 'u', 0)
      this.v = getIntegerOr(o, 'v', 0)
    }
  }

  public build (): Vertex {
    return Vertex.create(this.x, this.y, this.z, this.u, this.v)
  }
}
