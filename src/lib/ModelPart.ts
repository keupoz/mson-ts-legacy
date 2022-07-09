import { Euler, Material, Mesh, Object3D, Vector3 } from 'three'
import { TextureChunk } from './mson/api/model/Texture'
import { TreeChild } from './mson/api/ModelContext'
import { QuadGeometry } from './QuadGeometry'

export class ModelPart {
  private readonly cubes: Set<QuadGeometry>
  private readonly children: Map<string, TreeChild>

  private readonly rotation: Euler
  private readonly position: Vector3

  public name: string
  public visible: boolean

  constructor (cubes: Set<QuadGeometry>, children: Map<string, TreeChild>) {
    this.cubes = cubes
    this.children = children

    this.rotation = new Euler()
    this.position = new Vector3()

    this.name = ''
    this.visible = true
  }

  public getChild (name: string): TreeChild {
    const child = this.children.get(name)

    if (child === undefined) {
      throw new Error(`No child with the name ${name} in model part ${this.name}`)
    }

    return child
  }

  public setRotation (x: number, y: number, z: number): void {
    this.rotation.set(x, -y, -z)
  }

  public setPosition (x: number, y: number, z: number): void {
    this.position.set(x, -y, -z)
  }

  public export (material: Material): Object3D {
    const object = new Object3D()

    object.rotation.copy(this.rotation)
    object.position.copy(this.position)
    object.visible = this.visible
    object.name = this.name

    for (const [, child] of this.children) {
      object.add(child.export(material))
    }

    let i = 0

    for (const cube of this.cubes) {
      const mesh = new Mesh(cube.build(), material)
      mesh.name = `${this.name}_cube${i++}`
      object.add(mesh)
    }

    return object
  }

  public * exportTextures (): IterableIterator<TextureChunk> {
    for (const [, child] of this.children) {
      yield * child.exportTextures()
    }

    for (const cube of this.cubes) {
      yield cube.exportTexture()
    }
  }
}
