import { JsonObject } from '@keupoz/tson'
import { Identifier } from '../../../minecraft/Identifier'
import { QuadGeometry } from '../../../QuadGeometry'
import { Incomplete } from '../../api/Incomplete'
import { JsonContext } from '../../api/json/JsonContext'
import { BoxBuilder } from '../../api/model/BoxBuilder'
import { Axis } from '../../api/model/Face'
import { QuadsBuilder } from '../../api/model/QuadsBuilder'
import { ModelContext } from '../../api/ModelContext'
import { JsonBox } from './JsonBox'

export class JsonCone extends JsonBox {
  public static override readonly ID = new Identifier('mson', 'cone')

  private readonly taper: Incomplete<number>

  constructor (context: JsonContext, name: string, json: JsonObject) {
    super(context, name, json)

    this.taper = context.getLocals().getMember(json, 'taper')
  }

  public override export (context: ModelContext): QuadGeometry {
    return new BoxBuilder(context)
      .setTexture(this.texture.resolve(context))
      .setPosition(this.from.resolve(context))
      .setSize(this.size.resolve(context))
      .dilate(this.dilation.resolve(context))
      .setMirrorSingle(Axis.X, this.mirror)
      .build(QuadsBuilder.cone(this.taper.resolve(context)))
  }
}
