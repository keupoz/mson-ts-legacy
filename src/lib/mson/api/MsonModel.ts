import { Material, Mesh, Object3D } from 'three'
import { Identifier } from '../../minecraft/Identifier'
import { ModelPart } from '../../ModelPart'
import { SkinMaterial } from '../../SkinMaterial'
import { EmptyJsonContext } from '../impl/EmptyJsonContext'
import { ModelLocalsImpl } from '../impl/ModelLocalsImpl'
import { JsonContext } from './json/JsonContext'
import { Texture, TextureChunk } from './model/Texture'
import { ModelContext, TreeChild } from './ModelContext'

export type MsonModelFactory = new (id: Identifier, jsonContext: JsonContext) => MsonModel
export type DynamicModelFactory = new (id: Identifier, context: ModelContext) => DynamicModel

export class MsonModel {
  protected readonly id: Identifier
  private readonly jsonContext: JsonContext
  protected readonly material: SkinMaterial

  protected tree: ModelPart | null
  private intersectables: Object3D[] | null
  protected object: Object3D | null
  private texture: Texture | null

  constructor (id: Identifier, jsonContext: JsonContext) {
    this.id = id
    this.jsonContext = jsonContext
    this.material = new SkinMaterial()

    this.tree = null
    this.intersectables = null
    this.object = null
    this.texture = null
  }

  public getId (): Identifier {
    return this.id
  }

  public getTree (): ModelPart {
    if (this.tree === null) {
      const locals = new ModelLocalsImpl(this.id, this.jsonContext.getLocals())
      const modelContext = this.jsonContext.createContext(this, locals)

      this.tree = this.init(modelContext)
    }

    return this.tree
  }

  public getIntersectables (): Object3D[] {
    if (this.intersectables === null) {
      this.intersectables = this.collectIntersectables()
    }

    return this.intersectables
  }

  public export (material: Material = this.material): Object3D {
    if (this.object === null) {
      this.object = this.getTree().export(material)
      this.object.name = this.id.toString()
    }

    return this.object
  }

  public getTexture (): Texture {
    if (this.texture === null) {
      throw new Error(`Texture of model ${this.id.toString()} is not initialized`)
    }

    return this.texture
  }

  public getMaterial (): SkinMaterial {
    return this.material
  }

  public async setTexture (id: string | Identifier, type: string): Promise<void> {
    const image = await this.jsonContext.getLoader().loadImage(id, type)

    this.material.drawImage(image)
  }

  public * exportTextures (): IterableIterator<TextureChunk> {
    yield * this.getTree().exportTextures()
  }

  protected init (context: ModelContext): ModelPart {
    this.texture = context.getLocals().getTexture()

    const treeMap = new Map<string, TreeChild>()

    context.getTree(context, treeMap)

    return new ModelPart(new Set(), treeMap)
  }

  protected collectIntersectables (): Object3D[] {
    const result: Object3D[] = []

    function collect (object: Object3D): void {
      if (object.userData['intersectable'] === false) {
        return
      }

      for (const child of object.children) {
        collect(child)

        if (child instanceof Mesh) {
          result.push(child)
        }
      }
    }

    collect(this.export())

    return result
  }
}

export class DynamicModel extends MsonModel {
  protected override readonly tree: ModelPart

  constructor (id: Identifier, context: ModelContext) {
    super(id, EmptyJsonContext.INSTANCE)

    this.tree = this.init(context)
  }

  public override getTree (): ModelPart {
    return this.tree
  }
}

export class Implementation {
  public static readonly NULL = new Implementation('null', DynamicModel)

  private readonly id: Identifier
  private readonly factory: DynamicModelFactory

  constructor (className: string, factory: DynamicModelFactory) {
    this.id = new Identifier('dynamic', className.replaceAll('.', '/').toLowerCase())
    this.factory = factory
  }

  public getId (): Identifier {
    return this.id
  }

  public createModel (context: ModelContext): MsonModel {
    const Model = this.factory

    return new Model(this.id, context)
  }
}
