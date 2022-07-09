import { JsonObject } from '@keupoz/tson'
import { Identifier } from './minecraft/Identifier'
import { JsonContext } from './mson/api/json/JsonContext'
import { MsonModel } from './mson/api/MsonModel'
import { StoredModelData } from './mson/impl/StoredModelData'
import { MsonLoader } from './MsonLoader'

export class MsonFile {
  private readonly id: Identifier
  private readonly loader: MsonLoader
  private readonly json: JsonObject
  private data: JsonContext | null

  constructor (loader: MsonLoader, id: Identifier, json: JsonObject) {
    this.id = id
    this.loader = loader
    this.json = json

    this.data = null
  }

  public getId (): Identifier {
    return this.id
  }

  public async createModel (): Promise<MsonModel> {
    const jsonContext = await this.getModelData()
    const model = new MsonModel(this.id, jsonContext)

    return model
  }

  public async getModelData (): Promise<JsonContext> {
    if (this.data === null) {
      this.data = await StoredModelData.create(this.loader, this.id, this.json)
    }

    return this.data
  }
}
