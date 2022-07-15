import { Mesh, Object3D } from 'three'
import { Converter } from '../lib/3d/Converter'
import { HornGlowMaterial } from '../lib/3d/SkinMaterial'
import { ThreeConverter } from '../lib/3d/ThreeConverter'
import { ModelPart } from '../lib/minecraft/ModelPart'
import { ModelContext } from '../lib/mson/api/ModelContext'
import { MsonModel } from '../lib/mson/api/MsonModel'

export class UnicornHorn extends MsonModel {
  private readonly glowMaterial = new HornGlowMaterial()

  private horn: ModelPart | null = null
  private glow: ModelPart | null = null

  public override init (context: ModelContext): void {
    this.horn = context.findByName('bone')
    this.glow = context.findByName('corona')
  }

  public override export <T> (converter: Converter<T, any>): T {
    if (converter instanceof ThreeConverter) {
      const object = new Object3D()

      if (this.horn !== null) {
        object.add(this.horn.export(converter))
      }

      if (this.glow !== null) {
        const glow = converter.buildModelPart(this.glow, this.glowMaterial)

        for (const child of glow.children) {
          if (child instanceof Mesh) {
            child.renderOrder = 999
            child.layers.mask = 0b1
          }
        }

        object.add(glow)
      }

      object.name = this.getId().toString()

      return object as any
    }

    return super.export(converter)
  }
}
