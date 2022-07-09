import { JsonElement, JsonObject } from '@keupoz/tson'
import { Identifier } from '../../minecraft/Identifier'
import { MsonLoader } from '../../MsonLoader'
import { QuadGeometry } from '../../QuadGeometry'
import { Tuple3 } from '../../Tuple'
import { Incomplete } from '../api/Incomplete'
import { ExportResult, JsonComponent } from '../api/json/JsonComponent'
import { JsonContext, JsonContextLocals } from '../api/json/JsonContext'
import { Texture } from '../api/model/Texture'
import { ExtraContext, ModelContext, ModelContextLocals, TreeChild } from '../api/ModelContext'
import { MsonModel } from '../api/MsonModel'
import { accept, acceptNumbers } from '../util/JsonUtil'
import { EmptyJsonContext } from './EmptyJsonContext'
import { JsonLocalsImpl } from './JsonLocalsImpl'
import { Block, Local } from './Local'
import { JsonCompound } from './model/JsonCompound'
import { JsonLink } from './model/JsonLink'
import { unlocalizedTexture } from './model/JsonTexture'
import { SubContext } from './SubContext'

export class StoredModelData implements JsonContext {
  private readonly loader: MsonLoader
  private readonly elements: Map<string, JsonComponent>
  private readonly parent: JsonContext
  private readonly variables: JsonContextLocals

  private constructor (loader: MsonLoader, id: Identifier, json: JsonObject, parent: JsonContext) {
    this.loader = loader

    this.parent = parent

    this.variables = new RootVariables(id, json, this.parent.getLocals())
    this.elements = new Map()

    for (const [name, element] of this.parseElements(json)) {
      this.elements.set(name, element)
    }
  }

  public getLoader (): MsonLoader {
    return this.loader
  }

  public static async create (loader: MsonLoader, id: Identifier, json: JsonObject): Promise<JsonContext> {
    const parentName = accept(json, 'parent')
    let parent: JsonContext = EmptyJsonContext.INSTANCE

    if (parentName !== null) {
      const id = Identifier.of(parentName.getAsString())
      const file = await loader.getFile(id)
      parent = await file.getModelData()
    }

    return new StoredModelData(loader, id, json, parent)
  }

  private * parseElements (json: JsonObject): IterableIterator<[string, JsonComponent]> {
    const data = json.get('data')

    if (data !== null) {
      for (const [key, value] of data.getAsObject().entries()) {
        if (value.isObject() || (value.isPrimitive() && value.isString())) {
          const component = this.loadComponent(key, value, JsonCompound.ID)

          if (component !== null) {
            yield [key, component]
          }
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

  public loadComponent (name: string | null, json: JsonElement, defaultAs: Identifier): JsonComponent | null {
    if (json.isObject()) {
      name = (name ?? '').trim()
      const rawType = accept(json, 'type')
      const type = rawType === null ? defaultAs : Identifier.of(rawType.getAsString())

      const Component = this.loader.getComponentFactory(type)

      return new Component(this, name, json)
    }

    if (json.isPrimitive()) {
      if (json.isString()) {
        return new JsonLink(json.getAsString())
      }
    }

    throw new Error('Input is not a json object and could not be resolved to a link')
  }

  public async resolve (json: JsonElement): Promise<JsonContext> {
    if (json.isPrimitive()) {
      const file = await this.loader.getFile(Identifier.of(json.getAsString()))
      return await file.getModelData()
    }

    const id = this.getLocals().getModelId()
    const autoGenId = new Identifier(id.getNamespace(), `${id.getPath()}_dymamic`)

    if (json.getAsObject().has('data')) {
      throw new Error('Dynamic model files should not have a nested data block')
    }

    const file = new JsonObject()
    file.set('data', json)

    return await StoredModelData.create(this.loader, autoGenId, file)
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

  private readonly objectCache: Map<string, ExportResult>

  constructor (model: MsonModel, inherited: ModelContext, locals: ModelContextLocals, elements: Map<string, JsonComponent>) {
    this.model = model
    this.inherited = inherited
    this.locals = locals

    this.elements = elements

    this.objectCache = new Map()
  }

  public getModel (): MsonModel {
    return this.model
  }

  public setModel (model: MsonModel): void {
    this.model = model
  }

  public getContext (): ExtraContext {
    return this.model
  }

  public getLocals (): ModelContextLocals {
    return this.locals
  }

  public getTree (context: ModelContext, tree: Map<string, TreeChild>): void {
    for (const [name, element] of this.elements) {
      if (!tree.has(name)) {
        const result = element.export(context)

        if (!(result instanceof QuadGeometry)) {
          tree.set(name, result)
        }
      }
    }

    this.inherited.getTree(context, tree)
  }

  public findByName (context: ModelContext, name: string): ExportResult {
    const element = this.elements.get(name)

    if (element === undefined) {
      return this.inherited.findByName(context, name)
    }

    return element.export(context)
  }

  public computeIfAbsent<T extends ExportResult> (name: string, supplier: (key: string) => T): T {
    if (name.length === 0) {
      return supplier(name)
    }

    let value = this.objectCache.get(name)

    if (value === undefined) {
      value = supplier(name)
    }

    return value as T
  }

  public resolve (child: ExtraContext, locals: ModelContextLocals): ModelContext {
    if (child === this.getContext() && locals === this.getLocals()) {
      return this
    }

    return new SubContext(this, locals, child)
  }

  public getRoot (): ModelContext {
    return this
  }
}
