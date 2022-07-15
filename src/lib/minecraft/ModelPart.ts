import { Euler, Vector3 } from 'three'
import { Converter } from '../3d/Converter'
import { TreeChild } from '../mson/api/ModelContext'
import { QuadGeometry } from '../QuadGeometry'

export class ModelPart {
  private readonly cubes: Set<QuadGeometry>
  private readonly children: Map<string, TreeChild>

  private readonly rotation: Euler
  private readonly position: Vector3

  private readonly name: string
  public visible: boolean

  constructor (name: string, cubes: Set<QuadGeometry>, children: Map<string, TreeChild>) {
    this.cubes = cubes
    this.children = children

    this.rotation = new Euler()
    this.position = new Vector3()

    this.name = name
    this.visible = true
  }

  public getName (): string {
    return this.name
  }

  public getChild (name: string): TreeChild {
    const child = this.children.get(name)

    if (child === undefined) {
      throw new Error(`No child with the name ${name} in model part ${this.name}`)
    }

    return child
  }

  public getChildren (): IterableIterator<[string, TreeChild]> {
    return this.children.entries()
  }

  public getCubes (): IterableIterator<QuadGeometry> {
    return this.cubes.values()
  }

  public setRotation (x: number, y: number, z: number): void {
    this.rotation.set(x, y, z)
  }

  public setPosition (x: number, y: number, z: number): void {
    this.position.set(x, y, z)
  }

  public getRotation (): Euler {
    return this.rotation
  }

  public getPosition (): Vector3 {
    return this.position
  }

  public export <T> (converter: Converter<T, any>): T {
    return converter.buildModelPart(this)
  }
}
