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

export class JsonPlane extends JsonComponent<QuadGeometry> {
  public static readonly ID = new Identifier('mson', 'plane')

  private readonly position: Incomplete<Tuple3<number>>
  private readonly size: Incomplete<Tuple2<number>>
  private readonly dilation: Incomplete<Tuple3<number>>
  private readonly texture: Incomplete<Texture>
  private readonly mirror: Tuple2<boolean> = [false, false]
  private readonly face: Face

  constructor (context: JsonContext, name: string, json: JsonObject) {
    super(name)

    const callerStack = [JsonPlane.ID, context.getLocals().getModelId()]

    this.position = context.getLocals().getArray(json, 'position', 3)
    this.size = context.getLocals().getArray(json, 'size', 2)
    this.texture = incompleteTexture(accept(json, 'texture'))
    acceptBooleans(json, 'mirror', this.mirror)
    this.dilation = context.getLocals().getArray(json, 'dilate', 3)
    this.face = Face.of(jsonRequire(json, 'face', ...callerStack).getAsString())
  }

  public export (context: ModelContext): QuadGeometry {
    return new BoxBuilder(context)
      .setTexture(this.texture.resolve(context))
      .setMirror(this.face.getAxis(), this.mirror)
      .setPosition(this.position.resolve(context))
      .setSizeAxis(this.face.getAxis(), this.size.resolve(context))
      .dilate(this.dilation.resolve(context))
      .build(this.name, QuadsBuilder.plane(this.face))
  }
}
