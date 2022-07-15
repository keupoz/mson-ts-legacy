import { Identifier } from '../../minecraft/Identifier'
import { Tuple3 } from '../../Tuple'
import { JsonContextLocals } from '../api/json/JsonContext'
import { Texture } from '../api/model/Texture'
import { ModelContextLocals } from '../api/ModelContext'
import { computeIfAbsent } from '../util/Map'

export class ModelLocalsImpl implements ModelContextLocals {
  private readonly context: JsonContextLocals

  private readonly cache = new Map<string, number>()

  constructor (context: JsonContextLocals) {
    this.context = context
  }

  public getModelId (): Identifier {
    return this.context.getModelId()
  }

  public getDilation (): Tuple3<number> {
    return this.context.getDilation()
  }

  public getTexture (): Texture {
    return this.context.getTexture()
  }

  public getLocal (name: string): number {
    return computeIfAbsent(this.cache, name, (n) => {
      const value = this.context.getLocal(n)

      return value.complete(new StackFrame(this, n))
    })
  }

  public keys (): Set<string> {
    return this.context.keys()
  }

  public toString (): string {
    return `[ModelLocalsImpl id=${this.context.getModelId().toString()}]`
  }
}

class StackFrame implements ModelContextLocals {
  private readonly currentVariableRef: string
  private readonly parent: ModelContextLocals

  constructor (parent: ModelContextLocals, currentVariableRef: string) {
    this.currentVariableRef = currentVariableRef.toLowerCase()
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
    if (name.toLowerCase() === this.currentVariableRef) {
      throw new Error(`Cyclical reference. ${this.toString()}`)
    }

    return this.parent.getLocal(name)
  }

  public keys (): Set<string> {
    return this.parent.keys()
  }

  public toString (): string {
    return `${this.parent.toString()} -> ${this.currentVariableRef}`
  }
}
