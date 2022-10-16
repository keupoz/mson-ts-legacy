import { BufferAttribute, BufferGeometry, Material, Mesh, Object3D } from 'three'
import { ModelPart } from '../minecraft/ModelPart'
import { MsonModel } from '../mson/api/MsonModel'
import { QuadGeometry } from '../QuadGeometry'
import { Converter } from './Converter'
import { SkinMaterial } from './SkinMaterial'

export class ThreeConverter extends Converter<Object3D, BufferGeometry> {
  private readonly material = new SkinMaterial()

  public setTexture (image: HTMLCanvasElement | HTMLImageElement | null): void {
    this.material.setTexture(image)
  }

  public buildModelPart (part: ModelPart, material: Material = this.material): Object3D {
    const cached = this.partCache.get(part)

    if (cached !== undefined) return cached

    const object = new Object3D()

    object.rotation.copy(part.getRotation())
    object.position.copy(part.getPosition())

    object.rotation.y *= -1
    object.rotation.z *= -1

    object.position.y *= -1
    object.position.z *= -1

    object.visible = part.visible
    object.name = part.getName()

    for (const [key, child] of part.getChildren()) {
      let result

      if (child instanceof MsonModel) {
        result = this.buildModel(child)
      } else {
        result = child.export(this)
      }

      result.name = key

      object.add(result)
    }

    for (const cube of part.getCubes()) {
      const geometry = cube.export(this)
      const mesh = new Mesh(geometry, material)
      mesh.name = cube.getName()
      mesh.layers.mask = 0b11
      object.add(mesh)
    }

    this.partCache.set(part, object)

    return object
  }

  public buildGeometry (geometry: QuadGeometry): BufferGeometry {
    const cached = this.geometryCache.get(geometry)

    if (cached !== undefined) return cached

    const result = new BufferGeometry()
    const position: number[] = []
    const uv: number[] = []
    const index: number[] = []

    let i = 0

    for (const quad of geometry.getQuads()) {
      for (const { pos: { x, y, z }, u, v } of quad.vertices) {
        position.push(x, -y, -z)
        uv.push(u, 1 - v)
      }

      const a = i
      const b = i + 1
      const c = i + 2
      const d = i + 3

      index.push(a, b, d)
      index.push(b, c, d)

      i += quad.vertices.length
    }

    result.setAttribute('position', new BufferAttribute(new Float32Array(position), 3))
    result.setAttribute('uv', new BufferAttribute(new Float32Array(uv), 2))
    result.setIndex(index)

    result.computeVertexNormals()

    result.name = geometry.getName()

    this.geometryCache.set(geometry, result)

    return result
  }
}
