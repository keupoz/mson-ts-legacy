import { Material, Mesh, Object3D } from 'three'
import { ModelPart } from './lib/ModelPart'
import { ModelContext, TreeChild } from './lib/mson/api/ModelContext'
import { DynamicModel } from './lib/mson/api/MsonModel'
import { HornGlowMaterial, SkinMaterial } from './lib/SkinMaterial'

export class UnicornHorn extends DynamicModel {
  protected override material!: SkinMaterial
  private readonly glowMaterial = new HornGlowMaterial()

  private horn!: TreeChild
  private glow!: TreeChild

  protected override init (context: ModelContext): ModelPart {
    const tree = super.init(context)

    this.material = context.getModel().getMaterial()

    this.horn = tree.getChild('bone')
    this.glow = tree.getChild('corona')

    return tree
  }

  public override export (material: Material = this.material): Object3D {
    if (this.object === null) {
      this.object = new Object3D()

      this.object.add(this.horn.export(material))

      const glow = this.glow.export(this.glowMaterial)
      glow.userData['intersectable'] = false

      for (const child of glow.children) {
        if (child instanceof Mesh) {
          child.renderOrder = 999
        }
      }

      this.object.add(glow)

      this.object.name = this.id.toString()
    }

    return this.object
  }
}
