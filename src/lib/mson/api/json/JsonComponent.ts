import { JsonObject } from '@keupoz/tson'
import { Class } from '../../util/Class'
import { accept } from '../../util/JsonUtil'
import { ModelContext } from '../ModelContext'
import { JsonContext } from './JsonContext'

export type JsonComponentFactory<T = unknown> = new (context: JsonContext, name: string, json: JsonObject) => JsonComponent<T>

export abstract class JsonComponent<T = unknown> {
  protected resolveName (name: string, json: JsonObject): string {
    return name.length === 0 ? accept(json, 'name')?.getAsString() ?? name : name
  }

  public tryExport<K extends any>(context: ModelContext, type: Class<K>): K | null {
    const result = this.export(context)

    return result instanceof type ? result : null
  }

  public abstract export (context: ModelContext): T
}
