import { Quad, QuadGeometry, VertexTuple } from '../../../QuadGeometry'
import { Tuple3 } from '../../../Tuple'
import { ModelContext } from '../ModelContext'
import { CoordinateFixture } from './CoordinateFixture'
import { Axis } from './Face'
import { PartBuilder } from './PartBuilder'
import { QuadsBuilder } from './QuadsBuilder'
import { Texture } from './Texture'

export class BoxBuilder {
  public readonly parent: PartBuilder

  public readonly position: Tuple3<number> = [0, 0, 0]
  public readonly size: Tuple3<number> = [0, 0, 0]
  public readonly dilation: Tuple3<number> = [0, 0, 0]

  public u: number
  public v: number

  public mirror: Tuple3<boolean>

  public fixture: CoordinateFixture = CoordinateFixture.NULL

  constructor (context: ModelContext) {
    const parent = context.getContext()

    if (!(parent instanceof PartBuilder)) {
      throw new Error('Got extra context different from PartBuilder')
    }

    this.parent = parent

    this.dilate(context.getLocals().getDilation())

    this.u = parent.texture.getU()
    this.v = parent.texture.getV()

    this.mirror = [...parent.mirror]
  }

  public setFixture (fixture: CoordinateFixture): this {
    this.fixture = fixture
    return this
  }

  public setPosition (position: Tuple3<number>): this {
    this.position[0] = position[0]
    this.position[1] = position[1]
    this.position[2] = position[2]

    return this
  }

  public setTexture (texture: Texture): this {
    this.u = texture.getU()
    this.v = texture.getV()

    return this
  }

  public setSize (size: Tuple3<number>): this {
    this.size[0] = size[0]
    this.size[1] = size[1]
    this.size[2] = size[2]

    return this
  }

  public setSizeAxis (axis: Axis, dimensions: number[]): this {
    return this.setSize([
      axis.getWidth().getNumber(dimensions),
      axis.getHeight().getNumber(dimensions),
      axis.getDepth().getNumber(dimensions)
    ])
  }

  public dilate (dilation: Tuple3<number>): this {
    this.dilation[0] += dilation[0]
    this.dilation[1] += dilation[1]
    this.dilation[2] += dilation[2]

    return this
  }

  public setMirror (axis: Axis, mirror: boolean[]): this {
    this.mirror[0] = axis.getWidth().getBoolean(mirror)
    this.mirror[1] = axis.getHeight().getBoolean(mirror)
    this.mirror[2] = axis.getDepth().getBoolean(mirror)

    return this
  }

  public setMirrorSingle (axis: Axis, mirror: boolean | null): this {
    if (mirror !== null) {
      this.mirror[axis.ordinal()] = mirror
    }

    return this
  }

  public quad (vertices: VertexTuple, u: number, v: number, w: number, h: number, mirror = this.mirror[0]): Quad {
    const textureWidth = this.parent.texture.getWidth()
    const textureHeight = this.parent.texture.getHeight()

    return new Quad(vertices, u, v, u + w, v + h, textureWidth, textureHeight, mirror)
  }

  public build (builder: QuadsBuilder): QuadGeometry {
    return new QuadGeometry(this.buildQuads(builder))
  }

  public buildQuads (builder: QuadsBuilder): Quad[] {
    return builder.build(this)
  }
}
