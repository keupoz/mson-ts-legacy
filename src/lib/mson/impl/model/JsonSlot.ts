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

export class JsonSlot extends JsonComponent {
  public static readonly ID = new Identifier('mson', 'slot')

  private readonly implementation: Implementation
  private data: JsonContext | null
  private readonly locals: Block
  private readonly texture: Texture | null

  private readonly name: string

  constructor (context: JsonContext, name: string, json: JsonObject) {
    super()

    const caller = `mson:slot component in ${context.getLocals().getModelId().toString()}`

    this.data = null

    void context.resolve(jsonRequire(json, 'data', caller)).then((data) => {
      this.data = data
    })

    const className = jsonRequire(json, 'implementation', caller).getAsString()

    this.implementation = context.getLoader().getImplementation(className)
    this.name = name.length === 0 ? jsonRequire(json, 'name', caller).getAsString() : name

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

      const locals = new ModelLocalsImpl(this.implementation.getId(), new Locals(this.data, this.locals, this.texture))
      const subContext = this.data.createContext(context.getModel(), locals)
      // const inst = this.implementation.createModel(subContext)
      const inst = this.implementation.createModel(subContext.resolve(context.getContext(), subContext.getLocals()))

      return inst
    })
  }
}

class Locals extends JsonLocalsImpl {
  private readonly parent: JsonContextLocals
  private readonly locals: Block
  private readonly texture: Texture | null

  constructor (parent: JsonContext, locals: Block, texture: Texture | null) {
    super()

    this.parent = parent.getLocals()
    this.locals = locals
    this.texture = texture
  }

  public getModelId (): Identifier {
    return this.parent.getModelId()
  }

  public getDilation (): Tuple3<number> {
    return this.parent.getDilation()
  }

  public getTexture (): Texture {
    return this.texture ?? this.parent.getTexture()
  }

  public getLocal (name: string): Incomplete<number> {
    return this.locals.get(name) ?? this.parent.getLocal(name)
  }

  public keys (): Set<string> {
    return this.locals.appendKeys(this.parent.keys())
  }
}
