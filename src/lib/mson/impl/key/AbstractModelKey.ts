import { Identifier } from '../../../minecraft/Identifier'
import { JsonContext } from '../../api/json/JsonContext'
import { ModelKey } from '../../api/ModelKey'
import { MsonModel, MsonModelFactory } from '../../api/MsonModel'

export abstract class AbstractModelKey<T extends MsonModel> implements ModelKey<T> {
  protected abstract readonly id: Identifier

  public getId (): Identifier {
    return this.id
  }

  public abstract createModel <V extends T> (factory?: MsonModelFactory<V> | undefined): Promise<V>

  public abstract getModelData (): Promise<JsonContext | null>
}
