import { JsonElement, JsonObject } from '@keupoz/tson'
import { Identifier } from '../../minecraft/Identifier'
import { ModelPart } from '../../minecraft/ModelPart'
import { Tuple3 } from '../../Tuple'
import { Incomplete } from '../api/Incomplete'
import { JsonComponent } from '../api/json/JsonComponent'
import { JsonContext, JsonContextLocals } from '../api/json/JsonContext'
import { Texture } from '../api/model/Texture'
import { ModelContext, ModelContextLocals, TreeChild } from '../api/ModelContext'
import { MsonModel } from '../api/MsonModel'
import { accept, acceptNumbers } from '../util/JsonUtil'
import { computeIfAbsent } from '../util/Map'
import { EmptyJsonContext } from './EmptyJsonContext'
import { JsonLocalsImpl } from './JsonLocalsImpl'
import { Block, Local } from './Local'
import { JsonCompound } from './model/JsonCompound'
import { JsonImport } from './model/JsonImport'
import { JsonLink } from './model/JsonLink'
import { unlocalizedTexture } from './model/JsonTexture'
import { ModelFoundry } from './ModelFoundry'
import { Mson } from './Mson'
import { SubContext } from './SubContext'

export class StoredModelData implements JsonContext {
  private readonly foundry: ModelFoundry
  private readonly parent: JsonContext
  private readonly variables: JsonContextLocals

  private readonly elements = new Map<string, JsonComponent>()

  private constructor (foundry: ModelFoundry, id: Identifier, json: JsonObject, parent: JsonContext) {
    this.foundry = foundry
    this.parent = parent

    this.variables = new RootVariables(id, json, this.parent.getLocals())

    for (const [key, value] of this.getChildren(json)) {
      const component = this.loadComponent(key, value, JsonCompound.ID)

      if (component !== null) {
        this.elements.set(key, component)
      }
    }
  }

  public static async create (foundry: ModelFoundry, id: Identifier, json: JsonObject): Promise<JsonContext> {
    const parentName = accept(json, 'parent')
    let parent: JsonContext = EmptyJsonContext.INSTANCE

    if (parentName !== null) {
      const id = Identifier.of(parentName.getAsString())
      parent = await foundry.loadJsonModel(id)
    }

    return new StoredModelData(foundry, id, json, parent)
  }

  private * getChildren (json: JsonObject): IterableIterator<[string, JsonElement]> {
    const data = json.get('data')

    if (data !== null) {
      for (const [key, value] of data.getAsObject().entries()) {
        if (value.isObject() || (value.isPrimitive() && value.isString())) {
          yield [key, value]
        }
      }
    }
  }

  public getComponentNames (): Set<string> {
    const output = this.parent.getComponentNames()

    for (const key of this.elements.keys()) {
      output.add(key)
    }

    return output
  }

  public addNamedComponent (name: string, component: JsonComponent): void {
    if (name.length !== 0) {
      this.elements.set(name, component)
    }
  }

  public loadComponent (name: string, json: JsonElement, defaultAs: Identifier): JsonComponent | null {
    if (json.isObject()) {
      name = name.trim()
      const rawType = accept(json, 'type')
      const type = rawType === null ? defaultAs : rawType.getAsString()

      const Component = Mson.INSTANCE.getComponentType(type)

      return new Component(this, name, json)
    }

    if (json.isPrimitive()) {
      if (json.isString()) {
        const name = json.getAsString()

        if (name.startsWith('#')) {
          return new JsonLink(name)
        }

        return new JsonImport(this, name, json)
      }
    }

    throw new Error('Input is not a json object and could not be resolved to a #link or model reference')
  }

  public async resolve (json: JsonElement): Promise<JsonContext> {
    if (json.isPrimitive()) {
      return await this.foundry.loadJsonModel(json.getAsString())
    }

    const id = this.getLocals().getModelId()
    const autoGenId = new Identifier(id.getNamespace(), `${id.getPath()}_dymamic`)

    if (json.getAsObject().has('data')) {
      throw new Error('Dynamic model files should not have a nested data block')
    }

    const file = new JsonObject()
    file.set('data', json)

    return await StoredModelData.create(this.foundry, autoGenId, file)
  }

  public createContext (model: MsonModel, locals: ModelContextLocals): ModelContext {
    return new RootContext(model, this.parent.createContext(model, locals), locals, this.elements)
  }

  public getLocals (): JsonContextLocals {
    return this.variables
  }
}

export class RootVariables extends JsonLocalsImpl {
  private readonly id: Identifier
  private readonly parent: JsonContextLocals
  private readonly texture: Texture
  private readonly dilation: Tuple3<number>

  private readonly locals: Block

  constructor (id: Identifier, json: JsonObject, parent: JsonContextLocals) {
    super()

    this.id = id
    this.parent = parent
    this.texture = unlocalizedTexture(accept(json, 'texture'), parent.getTexture())
    this.locals = Local.of(accept(json, 'locals'))
    this.dilation = acceptNumbers<3>(json, 'dilate', new Array(3) as Tuple3<number>) ?? parent.getDilation()
  }

  public getModelId (): Identifier {
    return this.id
  }

  public getDilation (): Tuple3<number> {
    return this.dilation
  }

  public getTexture (): Texture {
    return this.texture
  }

  public getLocal (name: string): Incomplete<number> {
    return this.locals.get(name) ?? this.parent.getLocal(name)
  }

  public keys (): Set<string> {
    return this.locals.appendKeys(this.parent.keys())
  }
}

export class RootContext implements ModelContext {
  private model: MsonModel
  private readonly inherited: ModelContext
  private readonly locals: ModelContextLocals

  private readonly elements: Map<string, JsonComponent>

  private readonly objectCache = new Map<string, any>()

  constructor (model: MsonModel, inherited: ModelContext, locals: ModelContextLocals, elements: Map<string, JsonComponent>) {
    this.model = model
    this.inherited = inherited
    this.locals = locals

    this.elements = elements
  }

  public getModel (): MsonModel {
    return this.model
  }

  public setModel (model: MsonModel): void {
    this.model = model
  }

  public getContext (): unknown {
    return this.model
  }

  public getLocals (): ModelContextLocals {
    return this.locals
  }

  public getTree (tree: Map<string, TreeChild>, context: ModelContext = this): void {
    for (const [name, element] of this.elements) {
      if (!tree.has(name)) {
        const result = element.export(context)

        if (result instanceof ModelPart || result instanceof MsonModel) {
          tree.set(name, result)
        }
      }
    }

    this.inherited.getTree(tree, context)
  }

  public findByName <T>(name: string, context: ModelContext = this): T {
    const element = this.elements.get(name)

    if (element === undefined) {
      return this.inherited.findByName(name, context)
    }

    return element.export(context) as T
  }

  public computeIfAbsent <T>(name: string, supplier: (key: string) => T): T {
    if (name.length === 0) {
      return supplier(name)
    }

    return computeIfAbsent(this.objectCache, name, supplier)
  }

  public resolve (child: unknown, locals: ModelContextLocals = this.getLocals()): ModelContext {
    if (child === this.getContext() && locals === this.getLocals()) {
      return this
    }

    return new SubContext(this, locals, child)
  }

  public getRoot (): ModelContext {
    return this
  }
}
