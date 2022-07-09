import { BufferAttribute, BufferGeometry, Vector3 } from 'three'
import { Texture, TextureChunk } from './mson/api/model/Texture'
import { Tuple } from './Tuple'

export type VertexTuple = [...Tuple<Vertex, 4>, ...Vertex[]]

export class QuadGeometry {
  private readonly quads: Quad[]

  constructor (quads: Quad[]) {
    this.quads = quads
  }

  public exportTexture (): TextureChunk {
    const result = new TextureChunk()

    for (const quad of this.quads) {
      result.addChild(quad.texture)
    }

    return result
  }

  public build (): BufferGeometry {
    const geometry = new BufferGeometry()
    const position: number[] = []
    const uv: number[] = []
    const index: number[] = []

    let i = 0

    for (const quad of this.quads) {
      for (const { pos: { x, y, z }, u, v } of quad.vertices) {
        position.push(x, -y, -z)
        uv.push(u, 1 - v)
      }

      const a = i
      const b = i + 1
      const c = i + 2
      const d = i + 3

      index.push(a, b, d)
      index.push(b, c, d)

      i += quad.vertices.length
    }

    geometry.setAttribute('position', new BufferAttribute(new Float32Array(position), 3))
    geometry.setAttribute('uv', new BufferAttribute(new Float32Array(uv), 2))
    geometry.setIndex(index)

    geometry.computeVertexNormals()

    return geometry
  }
}

export class Quad {
  public readonly texture: Texture
  public readonly vertices: VertexTuple

  constructor (vertices: VertexTuple, u1: number, v1: number, u2: number, v2: number, squishU: number, squishV: number, flip: boolean) {
    this.texture = new Texture(u1, v1, u2, v2)
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
