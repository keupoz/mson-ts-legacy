import { JsonObject } from '@keupoz/tson'
import { Identifier } from '../../../minecraft/Identifier'
import { QuadGeometry } from '../../../QuadGeometry'
import { Tuple3 } from '../../../Tuple'
import { Incomplete } from '../../api/Incomplete'
import { JsonComponent } from '../../api/json/JsonComponent'
import { JsonContext } from '../../api/json/JsonContext'
import { BoxBuilder } from '../../api/model/BoxBuilder'
import { Axis } from '../../api/model/Face'
import { QuadsBuilder } from '../../api/model/QuadsBuilder'
import { Texture } from '../../api/model/Texture'
import { ModelContext } from '../../api/ModelContext'
import { accept, acceptBoolean } from '../../util/JsonUtil'
import { incompleteTexture } from './JsonTexture'

export class JsonBox extends JsonComponent<QuadGeometry> {
  public static readonly ID = new Identifier('mson', 'box')

  protected readonly from: Incomplete<Tuple3<number>>
  protected readonly size: Incomplete<Tuple3<number>>
  protected readonly dilation: Incomplete<Tuple3<number>>
  protected readonly mirror: boolean | null
  protected readonly texture: Incomplete<Texture>

  constructor (context: JsonContext, _name: string, json: JsonObject) {
    super()

    this.from = context.getLocals().getArray(json, 'from', 3)
    this.size = context.getLocals().getArray(json, 'size', 3)
    this.texture = incompleteTexture(accept(json, 'texture'))
    this.mirror = acceptBoolean(json, 'mirror')
    this.dilation = context.getLocals().getArray(json, 'dilate', 3)
  }

  public export (context: ModelContext): QuadGeometry {
    return new BoxBuilder(context)
      .setTexture(this.texture.resolve(context))
      .setPosition(this.from.resolve(context))
      .setSize(this.size.resolve(context))
      .dilate(this.dilation.resolve(context))
      .setMirrorSingle(Axis.X, this.mirror)
      .build('', QuadsBuilder.box())
  }
}
