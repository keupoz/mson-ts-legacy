import { JsonElement } from '@keupoz/tson'
import { Identifier } from '../../minecraft/Identifier'
import { Tuple3 } from '../../Tuple'
import { EmptyContextError } from '../api/error/EmptyContextError'
import { Incomplete } from '../api/Incomplete'
import { JsonComponent } from '../api/json/JsonComponent'
import { JsonContext, JsonContextLocals } from '../api/json/JsonContext'
import { Texture } from '../api/model/Texture'
import { ModelContext, ModelContextLocals } from '../api/ModelContext'
import { MsonModel } from '../api/MsonModel'
import { EmptyModelContext } from './EmptyModelContext'
import { JsonLocalsImpl } from './JsonLocalsImpl'

export class EmptyJsonContext extends JsonLocalsImpl implements JsonContext {
  public static readonly INSTANCE = new EmptyJsonContext()

  private constructor () {
    super()
  }

  public getModelId (): Identifier {
    return EmptyModelContext.ID
  }

  public async resolve (_json: JsonElement): Promise<JsonContext> {
    throw new EmptyContextError('resolve')
  }

  public getComponentNames (): Set<string> {
    return new Set()
  }

  public keys (): Set<string> {
    return new Set()
  }

  public addNamedComponent (_name: string, _component: JsonComponent): void {

  }

  public loadComponent (_name: string, _json: JsonElement, _defaultAs: Identifier): JsonComponent | null {
    return null
  }

  public createContext (_model: MsonModel, _locals: ModelContextLocals): ModelContext {
    return EmptyModelContext.INSTANCE
  }

  public getTexture (): Texture {
    return Texture.EMPTY
  }

  public getLocal (): Incomplete<number> {
    return Incomplete.ZERO
  }

  public getDilation (): Tuple3<number> {
    return [0, 0, 0]
  }

  public getLocals (): JsonContextLocals {
    return this
  }
}
