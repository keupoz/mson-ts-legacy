import { createJsonElement, JsonElement } from '@keupoz/tson'
import { Identifier } from './minecraft/Identifier'

export abstract class ResourceManager {
  protected readonly path: string

  private readonly pendingQueue: Array<Promise<JsonElement>> = []

  constructor (path: string) {
    this.path = path
  }

  public async waitForFiles (): Promise<void> {
    while (this.pendingQueue.length !== 0) {
      const promise = this.pendingQueue.pop()

      if (promise === undefined) continue

      await promise
    }
  }

  public async getResource (id: string | Identifier): Promise<JsonElement> {
    id = Identifier.of(id)

    const promise = this.loadResource(id)

    this.pendingQueue.push(promise)

    const result = await promise

    return result
  }

  protected abstract loadResource (id: Identifier): Promise<JsonElement>

  public async getImage (id: string | Identifier): Promise<HTMLImageElement> {
    return await new Promise((resolve, reject) => {
      id = Identifier.of(id)

      const image = new Image()

      image.onload = () => {
        resolve(image)
      }

      image.onerror = () => {
        reject(new Error(`Can't load image '${id.toString()}'`))
      }

      image.src = this.getPath(id)
    })
  }

  protected getPath (id: Identifier): string {
    return `${this.path}/${id.getNamespace()}/${id.getPath()}`
  }
}

export class FetchResourceManager extends ResourceManager {
  private readonly idMap: Record<string, string> | null

  constructor (path: string, idMap?: Record<string, string>) {
    super(path)

    this.idMap = idMap ?? null
  }

  protected async loadResource (id: string | Identifier): Promise<JsonElement> {
    id = Identifier.of(id)

    const r = await fetch(this.getPath(id))

    if (r.status !== 200) {
      throw new Error(`Can't load file ${id.toString()}`)
    }

    return createJsonElement(await r.json())
  }

  protected override getPath (id: Identifier): string {
    if (this.idMap === null) {
      return super.getPath(id)
    }

    const value = this.idMap[id.toString()]

    if (value === undefined) {
      throw new Error(`Unknown ID '${id.toString()}' in mapped FetchResourceManager`)
    }

    return value
  }
}
