import { Quad, Vertex } from '../../../QuadGeometry'
import { BoxBuilder } from './BoxBuilder'
import { Axis, Face } from './Face'

export abstract class QuadsBuilder {
  public static create (build: (ctx: BoxBuilder) => Quad[]): QuadsBuilder {
    return new (class extends QuadsBuilder {
      public build (ctx: BoxBuilder): Quad[] {
        return build(ctx)
      }
    })()
  }

  public abstract build (ctx: BoxBuilder): Quad[]

  public static box (): QuadsBuilder {
    return this.create((ctx) => {
      let [x, y, z] = ctx.position
      const [sizeX, sizeY, sizeZ] = ctx.size
      const [dx, dy, dz] = ctx.dilation
      const [mirror] = ctx.mirror

      const { u, v } = ctx
      const textureWidth = ctx.parent.texture.getWidth()
      const textureHeight = ctx.parent.texture.getHeight()

      let f = x + sizeX
      let g = y + sizeY
      let h = z + sizeZ

      x -= dx
      y -= dy
      z -= dz
      f += dx
      g += dy
      h += dz

      if (mirror) {
        const i = f
        f = x
        x = i
      }

      const vertex1 = Vertex.create(x, y, z, 0, 0)
      const vertex2 = Vertex.create(f, y, z, 0, 8)
      const vertex3 = Vertex.create(f, g, z, 8, 8)
      const vertex4 = Vertex.create(x, g, z, 8, 0)
      const vertex5 = Vertex.create(x, y, h, 0, 0)
      const vertex6 = Vertex.create(f, y, h, 0, 8)
      const vertex7 = Vertex.create(f, g, h, 8, 8)
      const vertex8 = Vertex.create(x, g, h, 8, 0)

      const j = u
      const k = u + sizeZ
      const l = u + sizeZ + sizeX
      const m = u + sizeZ + sizeX + sizeX
      const n = u + sizeZ + sizeX + sizeZ
      const o = u + sizeZ + sizeX + sizeZ + sizeX
      const p = v
      const q = v + sizeZ
      const r = v + sizeZ + sizeY

      const quads: Quad[] = []

      quads[2] = new Quad([vertex6, vertex5, vertex1, vertex2], k, p, l, q, textureWidth, textureHeight, mirror)
      quads[3] = new Quad([vertex3, vertex4, vertex8, vertex7], l, q, m, p, textureWidth, textureHeight, mirror)
      quads[1] = new Quad([vertex1, vertex5, vertex8, vertex4], j, q, k, r, textureWidth, textureHeight, mirror)
      quads[4] = new Quad([vertex2, vertex1, vertex4, vertex3], k, q, l, r, textureWidth, textureHeight, mirror)
      quads[0] = new Quad([vertex6, vertex2, vertex3, vertex7], l, q, n, r, textureWidth, textureHeight, mirror)
      quads[5] = new Quad([vertex5, vertex6, vertex7, vertex8], n, q, o, r, textureWidth, textureHeight, mirror)

      return quads
    })
  }

  public static cone (tipInset: number): QuadsBuilder {
    return QuadsBuilder.create((ctx) => {
      let xMax = ctx.position[0] + ctx.size[0] + ctx.dilation[0]
      const yMax = ctx.position[1] + ctx.size[1] + ctx.dilation[1]
      const zMax = ctx.position[2] + ctx.size[2] + ctx.dilation[2]

      let xMin = ctx.position[0] - ctx.dilation[0]
      const yMin = ctx.position[1] - ctx.dilation[1]
      const zMin = ctx.position[2] - ctx.dilation[2]

      if (ctx.mirror[0]) {
        const v = xMax
        xMax = xMin
        xMin = v
      }

      const tipXmin = xMin + ctx.size[0] * tipInset
      const tipZmin = zMin + ctx.size[2] * tipInset
      const tipXMax = xMax - ctx.size[0] * tipInset
      const tipZMax = zMax - ctx.size[2] * tipInset

      // w:west e:east d:down u:up s:south n:north
      const wds = Vertex.create(tipXmin, yMin, tipZmin, 0, 0)
      const eds = Vertex.create(tipXMax, yMin, tipZmin, 0, 8)
      const eus = Vertex.create(xMax, yMax, zMin, 8, 8)
      const wus = Vertex.create(xMin, yMax, zMin, 8, 0)
      const wdn = Vertex.create(tipXmin, yMin, tipZMax, 0, 0)
      const edn = Vertex.create(tipXMax, yMin, tipZMax, 0, 8)
      const eun = Vertex.create(xMax, yMax, zMax, 8, 8)
      const wun = Vertex.create(xMin, yMax, zMax, 8, 0)

      const j = ctx.u
      const k = ctx.u + ctx.size[2]
      const l = ctx.u + ctx.size[2] + ctx.size[0]
      const n = ctx.u + ctx.size[2] + ctx.size[0] + ctx.size[2]
      const p = ctx.v
      const q = ctx.v + ctx.size[2]

      return [
        ctx.quad([edn, eds, eus, eun], l, ctx.size[2], q, ctx.size[1]),
        ctx.quad([wds, wdn, wun, wus], j, ctx.size[2], q, ctx.size[1]),
        ctx.quad([edn, wdn, wds, eds], k, ctx.size[0], p, ctx.size[2]),
        ctx.quad([eus, wus, wun, eun], l, ctx.size[0], q, -ctx.size[2]),
        ctx.quad([eds, wds, wus, eus], k, ctx.size[0], q, ctx.size[1]),
        ctx.quad([wdn, edn, eun, wun], n, ctx.size[0], q, ctx.size[1])
      ]
    })
  }

  public static plane (face: Face): QuadsBuilder {
    return QuadsBuilder.create((ctx) => {
      let xMax = ctx.position[0] + ctx.size[0]
      let yMax = ctx.position[1] + ctx.size[1]
      let zMax = ctx.position[2] + ctx.size[2]

      xMax = ctx.fixture.stretchCoordinate(Axis.X, xMax, yMax, zMax, ctx.dilation[0])
      yMax = ctx.fixture.stretchCoordinate(Axis.Y, xMax, yMax, zMax, face.applyFixtures(ctx.dilation[1]))
      zMax = ctx.fixture.stretchCoordinate(Axis.Z, xMax, yMax, zMax, ctx.dilation[2])

      let xMin = ctx.fixture.stretchCoordinate(Axis.X, ...ctx.position, -ctx.dilation[0])
      let yMin = ctx.fixture.stretchCoordinate(Axis.Y, ...ctx.position, face.applyFixtures(-ctx.dilation[1]))
      let zMin = ctx.fixture.stretchCoordinate(Axis.Z, ...ctx.position, -ctx.dilation[2])

      if (ctx.mirror[0]) {
        const v = xMax
        xMax = xMin
        xMin = v
      }

      if (ctx.mirror[1]) {
        const v = yMax
        yMax = yMin
        yMin = v
      }

      if (ctx.mirror[2]) {
        const v = zMax
        zMax = zMin
        zMin = v
      }

      // w:west e:east d:down u:up s:south n:north
      const wds = Vertex.create(xMin, yMin, zMin, 0, 0)
      const eds = Vertex.create(xMax, yMin, zMin, 0, 8)
      const eus = Vertex.create(xMax, yMax, zMin, 8, 8)
      const wus = Vertex.create(xMin, yMax, zMin, 8, 0)
      const wdn = Vertex.create(xMin, yMin, zMax, 0, 0)
      const edn = Vertex.create(xMax, yMin, zMax, 0, 8)
      const eun = Vertex.create(xMax, yMax, zMax, 8, 8)
      const wun = Vertex.create(xMin, yMax, zMax, 8, 0)

      const mirror = ctx.mirror[0] || ctx.mirror[1] || ctx.mirror[2]

      switch (face) {
        case Face.EAST: return [ctx.quad([edn, eds, eus, eun], ctx.u, ctx.v, ctx.size[2], ctx.size[1], mirror)]
        case Face.WEST: return [ctx.quad([wds, wdn, wun, wus], ctx.u, ctx.v, ctx.size[2], ctx.size[1], mirror)]
        case Face.UP: return [ctx.quad([eus, wus, wun, eun], ctx.u, ctx.v, ctx.size[0], ctx.size[2], mirror)]
        case Face.DOWN: return [ctx.quad([edn, wdn, wds, eds], ctx.u, ctx.v, ctx.size[0], ctx.size[2], mirror)]
        case Face.SOUTH: return [ctx.quad([wdn, edn, eun, wun], ctx.u, ctx.v, ctx.size[0], ctx.size[1], mirror)]
        case Face.NORTH: return [ctx.quad([eds, wds, wus, eus], ctx.u, ctx.v, ctx.size[0], ctx.size[1], mirror)]
        default: throw new Error(`Unsupported face ${face.getName()}`)
      }
    })
  }
}
