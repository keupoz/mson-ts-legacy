import { JsonObject } from '@keupoz/tson'
import { Converter } from '../../3d/Converter'
import { Identifier } from '../../minecraft/Identifier'
import { ModelPart } from '../../minecraft/ModelPart'
import { computeIfAbsent } from '../util/Map'
import { ModelContext, TreeChild } from './ModelContext'

export type MsonModelFactory<T = MsonModel> = new (id: Identifier, tree: ModelPart) => T

export class MsonModel {
  public static readonly NULL = (() => {
    const id = new Identifier('mson', 'null')
    const tree = new ModelPart(id.toString(), new Set(), new Map())

    return new MsonModel(id, tree)
  })()

  protected readonly id: Identifier
  protected tree: ModelPart

  constructor (id: Identifier, tree: ModelPart) {
    this.id = id
    this.tree = tree
  }

  public getId (): Identifier {
    return this.id
  }

  public getTree (): ModelPart {
    return this.tree
  }

  public init (_context: ModelContext): void {

  }

  public export <T> (converter: Converter<T, any>): T {
    return converter.buildModelPart(this.tree)
  }
}

export class Implementation {
  private static readonly REGISTRY = new Map<string, Implementation>()

  public static register (className: string, factory: MsonModelFactory): void {
    if (this.REGISTRY.has(className)) {
      throw new Error(`An implementation with the className '${className}' is already registered`)
    }

    const instance = new Implementation(className, factory)
    this.REGISTRY.set(className, instance)
  }

  public static fromJson (json: JsonObject): Implementation {
    const rawClassName = json.get('implementation')

    if (rawClassName === null) {
      throw new Error('Slot requires an implemetation')
    }

    return computeIfAbsent(this.REGISTRY, rawClassName.getAsString(), (className) => {
      return new Implementation(className, MsonModel)
    })
  }

  private readonly id: Identifier
  private readonly factory: MsonModelFactory

  constructor (className: string, factory: MsonModelFactory) {
    this.id = new Identifier('dynamic', className.replaceAll(/[\\.\\$]/g, '/').toLowerCase())
    this.factory = factory
  }

  public getId (): Identifier {
    return this.id
  }

  public createModel (context: ModelContext): MsonModel {
    const Model = this.factory
    const tree = new Map<string, TreeChild>()

    context.getTree(tree)

    return new Model(this.id, new ModelPart(this.id.toString(), new Set(), tree))
  }
}
