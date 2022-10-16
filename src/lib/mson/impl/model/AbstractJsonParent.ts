import { JsonObject } from '@keupoz/tson'
import { Identifier } from '../../../minecraft/Identifier'
import { ModelPart } from '../../../minecraft/ModelPart'
import { Tuple3 } from '../../../Tuple'
import { Incomplete } from '../../api/Incomplete'
import { JsonComponent, resolveName } from '../../api/json/JsonComponent'
import { JsonContext } from '../../api/json/JsonContext'
import { PartBuilder } from '../../api/model/PartBuilder'
import { Texture } from '../../api/model/Texture'
import { ModelContext, ModelContextLocals } from '../../api/ModelContext'
import { accept, acceptBooleans, getBooleanOr } from '../../util/JsonUtil'
import { incompleteTexture } from './JsonTexture'

const DEG2RAD = Math.PI / 180

export abstract class AbstractJsonParent extends JsonComponent<ModelPart> {
  private readonly pivot: Incomplete<Tuple3<number>>
  public readonly dilation: Incomplete<Tuple3<number>>
  private readonly rotation: Incomplete<Tuple3<number>>
  private readonly mirror: Tuple3<boolean> = [false, false, false]
  private readonly visible: boolean
  public readonly texture: Incomplete<Texture>

  constructor (context: JsonContext, name: string, json: JsonObject) {
    super(resolveName(name, json))

    this.pivot = context.getLocals().getArray(json, 'pivot', 3)
    this.dilation = context.getLocals().getArray(json, 'dilate', 3)

    this.rotation = context.getLocals().getArray(json, 'rotate', 3)
    acceptBooleans(json, 'mirror', this.mirror)
    this.visible = getBooleanOr(json, 'visible', true)
    this.texture = incompleteTexture(accept(json, 'texture'))

    context.addNamedComponent(this.name, this)
  }

  public export (context: ModelContext): ModelPart {
    return context.computeIfAbsent(this.name, (name) => {
      const builder = new PartBuilder()
      const subContext = context.resolve(builder, new Locals(context.getLocals(), this))

      return this.exportBuilder(subContext, builder).build(name)
    })
  }

  protected exportBuilder (context: ModelContext, builder: PartBuilder): PartBuilder {
    const rotation = this.rotation.resolve(context)

    builder
      .setHidden(!this.visible)
      .setPivot(this.pivot.resolve(context))
      .setMirror(this.mirror)
      .setRotation([
        rotation[0] * DEG2RAD,
        rotation[1] * DEG2RAD,
        rotation[2] * DEG2RAD
      ])
      .setTexture(this.texture.resolve(context))

    return builder
  }
}

class Locals implements ModelContextLocals {
  private readonly parent: ModelContextLocals
  private readonly component: AbstractJsonParent

  constructor (parent: ModelContextLocals, component: AbstractJsonParent) {
    this.parent = parent
    this.component = component
  }

  public getModelId (): Identifier {
    return this.parent.getModelId()
  }

  public getDilation (): Tuple3<number> {
    const inherited = this.parent.getDilation()
    const dilation = this.component.dilation.complete(this.parent)

    return [
      inherited[0] + dilation[0],
      inherited[1] + dilation[1],
      inherited[2] + dilation[2]
    ]
  }

  public getTexture (): Texture {
    return this.component.texture.complete(this.parent)
  }

  public getLocal (name: string): number {
    return this.parent.getLocal(name)
  }

  public keys (): Set<string> {
    return this.parent.keys()
  }
}
