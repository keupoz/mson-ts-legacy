import { ModelPart } from '../../../minecraft/ModelPart'
import { QuadGeometry } from '../../../QuadGeometry'
import { Tuple3 } from '../../../Tuple'
import { TreeChild } from '../ModelContext'
import { Texture } from './Texture'

export class PartBuilder {
  public texture: Texture = Texture.EMPTY

  private rotation: Tuple3<number> = [0, 0, 0]
  private pivot: Tuple3<number> = [0, 0, 0]

  public mirror: Tuple3<boolean> = [false, false, false]

  public readonly cubes: Set<QuadGeometry> = new Set()
  public readonly children: Map<string, TreeChild> = new Map()

  public hidden: boolean = false

  public addChild (name: string, child: TreeChild): this {
    this.children.set(name, child)
    return this
  }

  public addCube (cube: QuadGeometry): this {
    this.cubes.add(cube)
    return this
  }

  public setHidden (value: boolean): this {
    this.hidden = value
    return this
  }

  public setTexture (texture: Texture): this {
    this.texture = texture
    return this
  }

  public setRotation (rotation: Tuple3<number>): this {
    this.rotation = [...rotation]
    return this
  }

  public setPivot (pivot: Tuple3<number>): this {
    this.pivot = [...pivot]
    return this
  }

  public setMirror (mirror: Tuple3<boolean>): this {
    this.mirror = [...mirror]
    return this
  }

  public build (name: string): ModelPart {
    const part = new ModelPart(name, this.cubes, this.children)

    part.setRotation(...this.rotation)
    part.setPosition(...this.pivot)

    part.visible = !this.hidden

    return part
  }
}
