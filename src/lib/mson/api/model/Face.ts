import { Vector3 } from 'three'
import { Tuple3 } from '../../../Tuple'
import { Corner } from './Corner'

export class Parameter {
  private readonly index: number

  constructor (index: number) {
    this.index = index
  }

  public getNumber (dimensions: number[]): number {
    return dimensions[this.index] ?? 0
  }

  public getBoolean (dimensions: boolean[]): boolean {
    return dimensions[this.index] ?? false
  }
}

export class Axis {
  private static readonly VALUES = new Set<Axis>()

  private static lastId = -1

  public static readonly X = new Axis(-1, 1, 0)
  public static readonly Y = new Axis(0, -1, 1)
  public static readonly Z = new Axis(0, 1, -1)

  private readonly id: number

  private readonly widthIndex: Parameter
  private readonly heightIndex: Parameter
  private readonly depthIndex: Parameter

  private constructor (w: number, h: number, d: number) {
    this.id = ++Axis.lastId

    this.widthIndex = new Parameter(w)
    this.heightIndex = new Parameter(h)
    this.depthIndex = new Parameter(d)

    Axis.VALUES.add(this)
  }

  public static getValues (): IterableIterator<Axis> {
    return this.VALUES.values()
  }

  public ordinal (): number {
    return this.id
  }

  public getWidth (): Parameter {
    return this.widthIndex
  }

  public getHeight (): Parameter {
    return this.heightIndex
  }

  public getDepth (): Parameter {
    return this.depthIndex
  }
}

export class Face {
  private static readonly REGISTRY = new Map<string, Face>()

  public static readonly NONE = new Face('NONE', Axis.Y)
  public static readonly UP = new Face('UP', Axis.Y)
  public static readonly DOWN = new Face('DOWN', Axis.Y)
  public static readonly WEST = new Face('WEST', Axis.X)
  public static readonly EAST = new Face('EAST', Axis.X)
  public static readonly NORTH = new Face('NORTH', Axis.Z)
  public static readonly SOUTH = new Face('SOUTH', Axis.Z)

  private readonly name: string

  private readonly axis: Axis

  private constructor (name: string, axis: Axis) {
    this.name = name
    this.axis = axis

    Face.REGISTRY.set(name.toLowerCase(), this)
  }

  public static values (): IterableIterator<Face> {
    return this.REGISTRY.values()
  }

  public static of (name: string): Face {
    const face = Face.REGISTRY.get(name.toLowerCase())

    return face ?? Face.NONE
  }

  public getName (): string {
    return this.name
  }

  public applyFixtures (stretch: number): number {
    return (this.getAxis() === Axis.Y ? -1 : 1) * stretch
  }

  public getAxis (): Axis {
    return this.axis
  }

  public isInside (position: Tuple3<number>, dimensions: number[], vertex: Vector3): boolean {
    const [x, y, z] = position

    const dx = this.getAxis().getWidth().getNumber(dimensions)
    const dy = this.getAxis().getHeight().getNumber(dimensions)
    const dz = this.getAxis().getDepth().getNumber(dimensions)

    return Face.isBetween(vertex.x, x, x + dx) &&
           Face.isBetween(vertex.y, y, y + dy) &&
           Face.isBetween(vertex.z, z, z + dz)
  }

  private static isBetween (value: number, min: number, max: number): boolean {
    return value >= min && value <= max
  }

  public * getVertices (position: Tuple3<number>, dimensions: number[], axis: Axis, dilation: number): IterableIterator<Corner> {
    const min = new Vector3(...position)
    const max = new Vector3(
      this.getAxis().getWidth().getNumber(dimensions),
      this.getAxis().getHeight().getNumber(dimensions),
      this.getAxis().getDepth().getNumber(dimensions)
    )

    const str = new Vector3()
    const stretchedMin = min.clone()
    const stretchedMax = max.clone()

    if (dilation !== 0) {
      str.setComponent(axis.ordinal(), dilation)

      stretchedMin.sub(str)
      stretchedMax.add(str.clone().multiplyScalar(2))
    }

    for (const corner of Corner.CORNERS) {
      const cornerVec = min.clone().add(max.clone().multiply(corner))
      const stretched = dilation === 0 ? cornerVec : stretchedMin.clone().add(stretchedMax.clone().multiply(corner))

      yield new Corner(cornerVec, stretched)
    }
  }
}
