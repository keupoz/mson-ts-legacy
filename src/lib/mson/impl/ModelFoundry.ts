import { Identifier } from '../../minecraft/Identifier'
import { ResourceManager } from '../../ResourceManager'
import { JsonContext } from '../api/json/JsonContext'
import { EmptyJsonContext } from './EmptyJsonContext'
import { StoredModelData } from './StoredModelData'

export class ModelFoundry {
  private readonly manager: ResourceManager

  private readonly loadedFiles = new Map<string, JsonContext>()

  constructor (manager: ResourceManager) {
    this.manager = manager
  }

  public getResourceManager (): ResourceManager {
    return this.manager
  }

  public async getModelData (id: string | Identifier): Promise<JsonContext | null> {
    id = Identifier.of(id)

    let result = this.loadedFiles.get(id.toString())

    if (result === undefined) {
      result = await this.loadJsonModel(id)
    }

    if (result === EmptyJsonContext.INSTANCE) {
      return null
    }

    await this.manager.waitForFiles()

    return result
  }

  public async loadJsonModel (id: string | Identifier): Promise<JsonContext> {
    id = Identifier.of(id)

    const name = id.toString()
    const result = this.loadedFiles.get(name)

    if (result === undefined) {
      const file = new Identifier(id.getNamespace(), `models/${id.getPath()}.json`)
      const json = await this.manager.getResource(file)

      return await StoredModelData.create(this, id, json.getAsObject())
    }

    return result
  }
}
