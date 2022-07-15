import { Converter, TPart } from './3d/Converter'
import { Identifier } from './minecraft/Identifier'
import { ModelKey } from './mson/api/ModelKey'
import { MsonModel, MsonModelFactory } from './mson/api/MsonModel'
import { Mson } from './mson/impl/Mson'
import { Class } from './mson/util/Class'
import { ResourceManager } from './ResourceManager'

export class ModelManager<T extends Converter<P, unknown>, P = TPart<T>> {
  private readonly converter: Class<T>

  constructor (resourceManager: ResourceManager, converter: Class<T>) {
    this.converter = converter

    Mson.INSTANCE.reload(resourceManager)
  }

  public async getModel<V extends MsonModel> (id: string | Identifier, factory?: MsonModelFactory<V>): Promise<ModelEntry<V, T, P>> {
    const key = Mson.INSTANCE.registerModel(id, factory ?? MsonModel) as ModelKey<V>
    const Converter = this.converter

    return new ModelEntry(new Converter(), key)
  }
}

export class ModelEntry<V extends MsonModel, T extends Converter<P, any>, P> {
  public readonly converter: T
  public readonly key: ModelKey<V>

  constructor (converter: T, key: ModelKey<V>) {
    this.converter = converter
    this.key = key
  }

  public async createModel (): Promise<V> {
    return await this.key.createModel()
  }

  public build (model: V): P {
    return model.export(this.converter)
  }

  public async setTexture (id: string | Identifier): Promise<HTMLImageElement> {
    const manager = Mson.INSTANCE.getFoundry().getResourceManager()
    const image = await manager.getImage(id)
    this.converter.setTexture(image)

    return image
  }
}
