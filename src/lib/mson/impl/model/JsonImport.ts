import { JsonElement, JsonObject } from '@keupoz/tson'
import { Identifier } from '../../../minecraft/Identifier'
import { Tuple3 } from '../../../Tuple'
import { Incomplete } from '../../api/Incomplete'
import { JsonComponent, resolveName } from '../../api/json/JsonComponent'
import { JsonContext, JsonContextLocals } from '../../api/json/JsonContext'
import { Texture } from '../../api/model/Texture'
import { ModelContext, TreeChild } from '../../api/ModelContext'
import { accept, jsonRequire } from '../../util/JsonUtil'
import { JsonLocalsImpl } from '../JsonLocalsImpl'
import { Block, Local } from '../Local'
import { ModelLocalsImpl } from '../ModelLocalsImpl'

export class JsonImport extends JsonComponent<TreeChild> {
  public static readonly ID = new Identifier('mson', 'import')

  private file: JsonContext | null = null
  private readonly locals: Block | null

  constructor (context: JsonContext, name: string, json: JsonObject | JsonElement) {
    name = json.isObject() ? resolveName(name, json) : name

    super(name)

    const callerStack = [JsonImport.ID, context.getLocals().getModelId()]

    let rawData

    if (json.isObject()) {
      rawData = jsonRequire(json, 'data', ...callerStack)
      this.locals = Local.of(accept(json, 'locals'))
    } else {
      rawData = json
      this.locals = null
    }

    void context.resolve(rawData).then((data) => {
      this.file = data
    })

    context.addNamedComponent(this.name, this)
  }

  public export (context: ModelContext): TreeChild {
    return context.computeIfAbsent(this.name, () => {
      if (this.file === null) {
        throw new Error(`Data is not resolved yet. ${this.name}`)
      }

      const jsContext = this.file
      const locals = new ModelLocalsImpl(new Locals(jsContext.getLocals(), this.locals))
      const modelContext = jsContext.createContext(context.getModel(), locals)

      const tree = new Map<string, TreeChild>()
      modelContext.getTree(tree)

      if (tree.size !== 1) {
        throw new Error('Imported file must define exactly one part.')
      }

      const [result] = tree.values()

      if (result === undefined) {
        throw new Error('Unexpected condition')
      }

      return result
    })
  }
}

class Locals extends JsonLocalsImpl {
  private readonly parent: JsonContextLocals
  private readonly inherited: Block | null

  constructor (parent: JsonContextLocals, inherited: Block | null) {
    super()

    this.parent = parent
    this.inherited = inherited
  }

  public getModelId (): Identifier {
    return this.parent.getModelId()
  }

  public getDilation (): Tuple3<number> {
    return this.parent.getDilation()
  }

  public getTexture (): Texture {
    return this.parent.getTexture()
  }

  public getLocal (name: string): Incomplete<number> {
    return this.inherited?.get(name) ?? this.parent.getLocal(name)
  }

  public keys (): Set<string> {
    if (this.inherited === null) {
      return this.parent.keys()
    }

    return this.inherited.appendKeys(this.parent.keys())
  }
}
