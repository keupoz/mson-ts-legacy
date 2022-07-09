import { createJsonElement } from '@keupoz/tson'
import { Identifier } from './minecraft/Identifier'
import { JsonComponentFactory } from './mson/api/json/JsonComponent'
import { DynamicModelFactory, Implementation } from './mson/api/MsonModel'
import { JsonBox } from './mson/impl/model/JsonBox'
import { JsonCompound } from './mson/impl/model/JsonCompound'
import { JsonCone } from './mson/impl/model/JsonCone'
import { JsonPlanar } from './mson/impl/model/JsonPlanar'
import { JsonPlane } from './mson/impl/model/JsonPlane'
import { JsonQuads } from './mson/impl/model/JsonQuads'
import { JsonSlot } from './mson/impl/model/JsonSlot'
import { MsonFile } from './MsonFile'
import { loadImage } from './Utils'

export type FileFetcher = (id: Identifier) => Promise<string | unknown>

export class MsonLoader {
  private readonly path: string

  private readonly files: Map<string, MsonFile>
  private readonly componentTypes: Map<string, JsonComponentFactory>
  private readonly implementations: Map<string, Implementation>

  private readonly pendingQueue: Array<Promise<MsonFile>>
  private readonly pendingRegistry: Map<string, Promise<MsonFile>>

  private readonly fetch: FileFetcher

  constructor (path: string) {
    this.path = path

    this.files = new Map()
    this.componentTypes = new Map()
    this.implementations = new Map()

    this.pendingQueue = []
    this.pendingRegistry = new Map()

    this.registerComponentType(JsonCompound.ID, JsonCompound)
    this.registerComponentType(JsonBox.ID, JsonBox)
    this.registerComponentType(JsonPlane.ID, JsonPlane)
    this.registerComponentType(JsonPlanar.ID, JsonPlanar)
    this.registerComponentType(JsonSlot.ID, JsonSlot)
    this.registerComponentType(JsonCone.ID, JsonCone)
    this.registerComponentType(JsonQuads.ID, JsonQuads)

    this.fetch = async (id) => {
      const r = await fetch(this.resolvePath(id, 'models', 'json'))

      if (r.status !== 200) {
        throw new Error(`Can't load file ${id.toString()}`)
      }

      return await r.json()
    }
  }

  public async waitForFiles (): Promise<void> {
    while (this.pendingQueue.length !== 0) {
      const promise = this.pendingQueue.pop()

      if (promise === undefined) continue

      const result = await promise
      this.pendingRegistry.delete(result.getId().toString())
    }
  }

  public registerImplementation (className: string, modelFactory: DynamicModelFactory): void {
    const implementation = new Implementation(className, modelFactory)

    this.implementations.set(className, implementation)
  }

  public registerComponentType (id: string | Identifier, factory: JsonComponentFactory): void {
    id = Identifier.of(id)

    this.componentTypes.set(id.toString(), factory)
  }

  public getComponentFactory (id: Identifier): JsonComponentFactory {
    const factory = this.componentTypes.get(id.toString())

    if (factory === undefined) {
      throw new Error(`No component type with the name ${id.toString()}`)
    }

    return factory
  }

  public getImplementation (className: string): Implementation {
    const implementation = this.implementations.get(className)

    if (implementation === undefined) {
      return Implementation.NULL
    }

    return implementation
  }

  public async getFile (id: string | Identifier, fetch = this.fetch): Promise<MsonFile> {
    id = Identifier.of(id)

    const promise = this.loadFile(id, fetch)

    this.pendingQueue.push(promise)
    this.pendingRegistry.set(id.toString(), promise)

    const result = await promise

    return result
  }

  public registerFile (id: string | Identifier, json: string | unknown, force = false): MsonFile {
    id = Identifier.of(id)

    const name = id.toString()

    if (this.files.has(name) && !force) {
      throw new Error(`File with the id ${name} is already registered`)
    }

    if (typeof json === 'string') {
      json = JSON.parse(json)
    }

    const jsonElement = createJsonElement(json)
    const file = new MsonFile(this, id, jsonElement.getAsObject())

    this.files.set(name, file)

    return file
  }

  public async loadImage (id: string | Identifier, type: string): Promise<HTMLImageElement> {
    id = Identifier.of(id)

    return await loadImage(this.resolvePath(id, `textures/${type}`, 'png'))
  }

  private async loadFile (id: string | Identifier, fetch: FileFetcher): Promise<MsonFile> {
    id = Identifier.of(id)

    const name = id.toString()
    const file = this.files.get(name)

    if (file === undefined) {
      const pending = this.pendingRegistry.get(name)

      if (pending === undefined) {
        return this.registerFile(id, await fetch(id))
      }

      return await pending
    }

    return file
  }

  private resolvePath (id: Identifier, type: string, ext: string): string {
    return `${this.path}/${id.getNamespace()}/${type}/${id.getPath()}.${ext}`
  }
}
