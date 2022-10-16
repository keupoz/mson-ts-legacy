import { JsonObject } from '@keupoz/tson'
import { Identifier } from '../../../minecraft/Identifier'
import { Tuple3 } from '../../../Tuple'
import { Incomplete } from '../../api/Incomplete'
import { JsonComponent } from '../../api/json/JsonComponent'
import { JsonContext, JsonContextLocals } from '../../api/json/JsonContext'
import { Texture } from '../../api/model/Texture'
import { ModelContext } from '../../api/ModelContext'
import { Implementation, MsonModel } from '../../api/MsonModel'
import { accept, jsonRequire } from '../../util/JsonUtil'
import { JsonLocalsImpl } from '../JsonLocalsImpl'
import { Block, Local } from '../Local'
import { ModelLocalsImpl } from '../ModelLocalsImpl'
import { textureOf } from './JsonTexture'

export class JsonSlot extends JsonComponent<MsonModel> {
  public static readonly ID = new Identifier('mson', 'slot')

  public readonly implementation: Implementation
  private data: JsonContext | null = null
  public readonly locals: Block
  public readonly texture: Texture | null

  constructor (context: JsonContext, name: string, json: JsonObject) {
    const callerStack = [JsonSlot.ID, context.getLocals().getModelId()]

    if (name.length === 0) {
      name = jsonRequire(json, 'name', ...callerStack).getAsString()
    }

    super(name)

    void context.resolve(jsonRequire(json, 'data', ...callerStack)).then((data) => {
      this.data = data
    })

    this.implementation = Implementation.fromJson(json)

    const texture = accept(json, 'texture')

    if (texture === null) {
      this.texture = null
    } else {
      this.texture = textureOf(texture)
    }

    this.locals = Local.of(accept(json, 'locals'))

    context.addNamedComponent(this.name, this)
  }

  public export (context: ModelContext): MsonModel {
    return context.computeIfAbsent(this.name, () => {
      if (this.data === null) {
        throw new Error(`Data is not resolved yet. ${this.name}`)
      }

      const jsContext = this.data
      const locals = new ModelLocalsImpl(new Locals(jsContext, this))
      const subContext = jsContext.createContext(context.getModel(), locals)
      const inst = this.implementation.createModel(subContext)

      inst.init(subContext.resolve(context.getContext()))

      return inst
    })
  }
}

class Locals extends JsonLocalsImpl {
  private readonly parent: JsonContextLocals
  private readonly component: JsonSlot

  constructor (parent: JsonContext, component: JsonSlot) {
    super()

    this.parent = parent.getLocals()
    this.component = component
  }

  public getModelId (): Identifier {
    return this.component.implementation.getId()
  }

  public getDilation (): Tuple3<number> {
    return this.parent.getDilation()
  }

  public getTexture (): Texture {
    return this.component.texture ?? this.parent.getTexture()
  }

  public getLocal (name: string): Incomplete<number> {
    return this.component.locals.get(name) ?? this.parent.getLocal(name)
  }

  public keys (): Set<string> {
    return this.component.locals.appendKeys(this.parent.keys())
  }
}
