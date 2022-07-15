import { Identifier } from '../../minecraft/Identifier'
import { ModelPart } from '../../minecraft/ModelPart'
import { ResourceManager } from '../../ResourceManager'
import { JsonComponentFactory } from '../api/json/JsonComponent'
import { JsonContext } from '../api/json/JsonContext'
import { TreeChild } from '../api/ModelContext'
import { ModelKey } from '../api/ModelKey'
import { MsonModel, MsonModelFactory } from '../api/MsonModel'
import { AbstractModelKey } from './key/AbstractModelKey'
import { JsonBox } from './model/JsonBox'
import { JsonCompound } from './model/JsonCompound'
import { JsonCone } from './model/JsonCone'
import { JsonImport } from './model/JsonImport'
import { JsonPlanar } from './model/JsonPlanar'
import { JsonPlane } from './model/JsonPlane'
import { JsonQuads } from './model/JsonQuads'
import { JsonSlot } from './model/JsonSlot'
import { ModelFoundry } from './ModelFoundry'
import { ModelLocalsImpl } from './ModelLocalsImpl'
import { RootContext } from './StoredModelData'

export class Mson {
  public static readonly INSTANCE = new Mson()

  private readonly registeredModels = new Map<string, ModelKey<MsonModel>>()
  private readonly componentTypes = new Map<string, JsonComponentFactory>()

  private foundry: ModelFoundry | null = null

  private constructor () {
    this.componentTypes.set(JsonCompound.ID.toString(), JsonCompound)
    this.componentTypes.set(JsonBox.ID.toString(), JsonBox)
    this.componentTypes.set(JsonPlane.ID.toString(), JsonPlane)
    this.componentTypes.set(JsonPlanar.ID.toString(), JsonPlanar)
    this.componentTypes.set(JsonSlot.ID.toString(), JsonSlot)
    this.componentTypes.set(JsonCone.ID.toString(), JsonCone)
    this.componentTypes.set(JsonQuads.ID.toString(), JsonQuads)
    this.componentTypes.set(JsonImport.ID.toString(), JsonImport)
  }

  public getFoundry (): ModelFoundry {
    if (this.foundry === null) {
      throw new Error('Model foundry is loaded yet')
    }

    return this.foundry
  }

  public reload (resourceManager: ResourceManager): void {
    this.foundry = new ModelFoundry(resourceManager)
  }

  public getComponentType (id: string | Identifier): JsonComponentFactory {
    id = Identifier.of(id)

    const name = id.toString()
    const constructor = this.componentTypes.get(name)

    if (constructor === undefined) {
      throw new Error(`Component with the id '${name}' is not registered`)
    }

    return constructor
  }

  public registerModel<T extends MsonModel>(id: string | Identifier, constructor: MsonModelFactory<T>): ModelKey<T> {
    id = Identifier.of(id)

    const name = id.toString()

    this.checkNamespace(id.getNamespace())

    if (this.registeredModels.has(name)) {
      throw new Error(`A model with the id '${name}' is already registered`)
    }

    const key = new Key(this.getFoundry(), id, constructor)

    this.registeredModels.set(name, key as ModelKey<MsonModel>)

    return key
  }

  public registerComponentType (id: string | Identifier, constructor: JsonComponentFactory): void {
    id = Identifier.of(id)
    const name = id.toString()

    this.checkNamespace(id.getNamespace())

    if (this.componentTypes.has(id.toString())) {
      throw new Error(`A component with the id '${name}' is already registered`)
    }

    this.componentTypes.set(name, constructor)
  }

  private checkNamespace (namespace: string): void {
    namespace = namespace.toLowerCase()

    if (namespace === 'minecraft') {
      throw new Error(`ID must have a namespace other than '${namespace}'`)
    }

    if (namespace === 'mson' || namespace === 'dynamic') {
      throw new Error(`'${namespace}' is a reserved namespace`)
    }
  }
}

class Key<T extends MsonModel> extends AbstractModelKey<T> {
  private readonly foundry: ModelFoundry
  protected readonly id: Identifier
  private readonly factory: MsonModelFactory<T>

  constructor (foundry: ModelFoundry, id: Identifier, factory: MsonModelFactory<T>) {
    super()

    this.foundry = foundry
    this.id = id
    this.factory = factory
  }

  public async createModel<V extends T>(Factory = this.factory as MsonModelFactory<V>): Promise<V> {
    const context = await this.getModelData()

    if (context === null) {
      throw new Error(`Model file for ${this.getId().toString()} was not loaded!`)
    }

    const locals = new ModelLocalsImpl(context.getLocals())
    const ctx = context.createContext(MsonModel.NULL, locals)
    const tree = new Map<string, TreeChild>()

    ctx.getTree(tree)

    const root = new ModelPart('', new Set(), tree)
    const t = new Factory(this.getId(), root)

    if (ctx instanceof RootContext) {
      ctx.setModel(t)
    }

    t.init(ctx)

    return t
  }

  public async getModelData (): Promise<JsonContext | null> {
    return await this.foundry.getModelData(this.id)
  }
}
