import { Identifier } from '../../minecraft/Identifier'
import { JsonContext } from './json/JsonContext'
import { MsonModel, MsonModelFactory } from './MsonModel'

export interface ModelKey<T extends MsonModel>{
  getId: () => Identifier
  createModel: <V extends T>(factory?: MsonModelFactory<V>) => Promise<V>
  getModelData: () => Promise<JsonContext | null>
}
