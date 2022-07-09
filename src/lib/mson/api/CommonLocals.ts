import { Identifier } from '../../minecraft/Identifier'
import { Tuple3 } from '../../Tuple'
import { Texture } from './model/Texture'

export interface CommonLocals {
  getModelId: () => Identifier
  getTexture: () => Texture
  getDilation: () => Tuple3<number>
  keys: () => Set<string>
}
