import { JsonObject } from '@keupoz/tson'
import { Identifier } from '../../../minecraft/Identifier'
import { QuadGeometry } from '../../../QuadGeometry'
import { Tuple2, Tuple3 } from '../../../Tuple'
import { Incomplete } from '../../api/Incomplete'
import { JsonComponent } from '../../api/json/JsonComponent'
import { JsonContext } from '../../api/json/JsonContext'
import { BoxBuilder } from '../../api/model/BoxBuilder'
import { Face } from '../../api/model/Face'
import { QuadsBuilder } from '../../api/model/QuadsBuilder'
import { Texture } from '../../api/model/Texture'
import { ModelContext } from '../../api/ModelContext'
import { accept, acceptBooleans, jsonRequire } from '../../util/JsonUtil'
import { incompleteTexture } from './JsonTexture'

export class JsonPlane extends JsonComponent {
  public static readonly ID = new Identifier('mson', 'plane')

  private readonly position: Incomplete<Tuple3<number>>
  private readonly size: Incomplete<Tuple2<number>>
  private readonly dilation: Incomplete<Tuple3<number>>
  private readonly texture: Incomplete<Texture>
  private readonly mirror: Tuple2<boolean>
  private readonly face: Face

  constructor (context: JsonContext, _name: string, json: JsonObject) {
    super()

    this.position = context.getLocals().getMemberArray(json, 'position', 3)
    this.size = context.getLocals().getMemberArray(json, 'size', 2)
    this.texture = incompleteTexture(accept(json, 'texture'))

    this.mirror = [false, false]
    acceptBooleans(json, 'mirror', this.mirror)

    this.dilation = context.getLocals().getMemberArray(json, 'dilate', 3)
    this.face = Face.of(jsonRequire(json, 'face', `mson:plane in ${context.getLocals().getModelId().toString()}`).getAsString())
  }

  public export (context: ModelContext): QuadGeometry {
    return new BoxBuilder(context)
      .setTexture(this.texture.resolve(context))
      .setMirror(this.face.getAxis(), this.mirror)
      .setPosition(this.position.resolve(context))
      .setSizeAxis(this.face.getAxis(), this.size.resolve(context))
      .dilate(this.dilation.resolve(context))
      .build(QuadsBuilder.plane(this.face))
  }
}
