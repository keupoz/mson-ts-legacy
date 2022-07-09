import { Identifier } from '../../minecraft/Identifier'
import { Tuple3 } from '../../Tuple'
import { JsonContextLocals } from '../api/json/JsonContext'
import { Texture } from '../api/model/Texture'
import { ModelContextLocals } from '../api/ModelContext'

export class ModelLocalsImpl implements ModelContextLocals {
  private readonly id: Identifier
  private readonly context: JsonContextLocals

  private readonly cache: Map<string, number>

  constructor (id: Identifier, context: JsonContextLocals) {
    this.id = id
    this.context = context

    this.cache = new Map()
  }

  public getModelId (): Identifier {
    return this.id
  }

  public getDilation (): Tuple3<number> {
    return this.context.getDilation()
  }

  public getTexture (): Texture {
    return this.context.getTexture()
  }

  public getLocal (name: string): number {
    let value = this.cache.get(name)

    if (value === undefined) {
      value = this.context.getLocal(name).complete(new StackFrame(this, name))
    }

    return value
  }

  public keys (): Set<string> {
    return this.context.keys()
  }

  public toString (): string {
    return `[ModelLocalsImpl id=${this.id.toString()}]`
  }
}

class StackFrame implements ModelContextLocals {
  private readonly name: string
  private readonly parent: ModelContextLocals

  constructor (parent: ModelContextLocals, name: string) {
    this.name = name.toLowerCase()
    this.parent = parent
  }

  public getModelId (): Identifier {
    return this.parent.getModelId()
  }

  public getTexture (): Texture {
    return this.parent.getTexture()
  }

  public getDilation (): Tuple3<number> {
    return this.parent.getDilation()
  }

  public getLocal (name: string): number {
    if (name.toLowerCase() === this.name) {
      throw new Error(`Cyclical reference. ${this.toString()}`)
    }

    return this.parent.getLocal(name)
  }

  public keys (): Set<string> {
    return this.parent.keys()
  }

  public toString (): string {
    return `${this.parent.toString()} -> ${this.name}`
  }
}
