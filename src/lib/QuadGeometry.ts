import { Vector3 } from 'three'
import { Converter } from './3d/Converter'
import { Tuple } from './Tuple'

export type VertexTuple = [...Tuple<Vertex, 4>, ...Vertex[]]

export class QuadGeometry {
  private readonly name: string
  private readonly quads: Quad[]

  constructor (name: string, quads: Quad[]) {
    this.name = name
    this.quads = quads
  }

  public getName (): string {
    return this.name
  }

  public * getQuads (): IterableIterator<Quad> {
    yield * this.quads
  }

  public export <T> (converter: Converter<any, T>): T {
    return converter.buildGeometry(this)
  }
}

export class Quad {
  public readonly vertices: VertexTuple

  constructor (vertices: VertexTuple, u1: number, v1: number, u2: number, v2: number, squishU: number, squishV: number, flip: boolean) {
    this.vertices = vertices

    vertices[0] = vertices[0].remap(u2 / squishU, v1 / squishV)
    vertices[1] = vertices[1].remap(u1 / squishU, v1 / squishV)
    vertices[2] = vertices[2].remap(u1 / squishU, v2 / squishV)
    vertices[3] = vertices[3].remap(u2 / squishU, v2 / squishV)

    if (flip) {
      const i = vertices.length

      for (let j = 0; j < i / 2; ++j) {
        const k = i - 1 - j
        const vertex1 = vertices[j]
        const vertex2 = vertices[k]

        if (vertex1 === undefined || vertex2 === undefined) {
          throw new Error('One of vertices to swap is undefined')
        }

        vertices[j] = vertex2
        vertices[k] = vertex1
      }
    }
  }
}

export class Vertex {
  public readonly pos: Vector3
  public readonly u: number
  public readonly v: number

  constructor (pos: Vector3, u: number, v: number) {
    this.pos = pos
    this.u = u
    this.v = v
  }

  public static create (x: number, y: number, z: number, u: number, v: number): Vertex {
    return new Vertex(new Vector3(x, y, z), u, v)
  }

  public remap (u: number, v: number): Vertex {
    return new Vertex(this.pos, u, v)
  }
}
