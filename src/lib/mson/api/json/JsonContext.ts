import { JsonElement, JsonObject, JsonPrimitive } from '@keupoz/tson'
import { Identifier } from '../../../minecraft/Identifier'
import { MsonLoader } from '../../../MsonLoader'
import { Tuple } from '../../../Tuple'
import { CommonLocals } from '../CommonLocals'
import { Incomplete } from '../Incomplete'
import { ModelContext, ModelContextLocals } from '../ModelContext'
import { MsonModel } from '../MsonModel'
import { JsonComponent } from './JsonComponent'

export interface JsonContext {
  getLoader: () => MsonLoader
  addNamedComponent: (name: string, component: JsonComponent) => void
  loadComponent: (name: string, json: JsonElement, defaultAs: Identifier) => JsonComponent | null
  createContext: (model: MsonModel, locals: ModelContextLocals) => ModelContext
  getComponentNames: () => Set<string>
  resolve: (json: JsonElement) => Promise<JsonContext>
  getLocals: () => JsonContextLocals
}

export interface JsonContextLocals extends CommonLocals {
  getPrimitive: (json: JsonPrimitive) => Incomplete<number>
  getPrimitives: <N extends number>(...arr: Tuple<JsonPrimitive, N>) => Incomplete<Tuple<number, N>>
  getMemberArray: <N extends number>(json: JsonObject, member: string, length: N) => Incomplete<Tuple<number, N>>
  getMember: (json: JsonObject, member: string) => Incomplete<number>
  getLocal: (name: string) => Incomplete<number>
}