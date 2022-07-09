import { Identifier } from '../../minecraft/Identifier'
import { Tuple3 } from '../../Tuple'
import { EmptyContextError } from '../api/error/EmptyContextError'
import { ExportResult, JsonComponent } from '../api/json/JsonComponent'
import { Texture } from '../api/model/Texture'
import { ExtraContext, ModelContext, ModelContextLocals } from '../api/ModelContext'
import { MsonModel } from '../api/MsonModel'

export class EmptyModelContext implements ModelContext, ModelContextLocals {
  public static readonly INSTANCE = new EmptyModelContext()
  public static readonly ID = new Identifier('mson', 'null')

  private constructor () {}

  public getModel (): MsonModel {
    throw new EmptyContextError('getModel')
  }

  public getContext (): ExtraContext {
    throw new EmptyContextError('getContext')
  }

  public computeIfAbsent <T extends ExportResult>(name: string, supplier: (key: string) => T): T {
    return supplier(name)
  }

  public * getTree (): IterableIterator<JsonComponent> {

  }

  public findByName <T>(_context: ModelContext, name: string): T {
    throw new Error(`Key not found '${name}'`)
  }

  public getRoot (): ModelContext {
    return this
  }

  public resolve (): ModelContext {
    return this
  }

  public keys (): Set<string> {
    return new Set()
  }

  public getTexture (): Texture {
    return Texture.EMPTY
  }

  public getModelId (): Identifier {
    return EmptyModelContext.ID
  }

  public getLocal (): number {
    return 0
  }

  public getDilation (): Tuple3<number> {
    return [0, 0, 0]
  }

  public getLocals (): ModelContextLocals {
    return this
  }
}
