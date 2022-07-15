import { ModelPart } from '../minecraft/ModelPart'
import { MsonModel } from '../mson/api/MsonModel'
import { QuadGeometry } from '../QuadGeometry'

export type TPart<T> = T extends Converter<infer R, unknown> ? R : never

export abstract class Converter<TPart, TGeometry> {
  protected readonly modelCache = new WeakMap<MsonModel, TPart>()
  protected readonly partCache = new WeakMap<ModelPart, TPart>()
  protected readonly geometryCache = new WeakMap<QuadGeometry, TGeometry>()

  public buildModel (model: MsonModel): TPart {
    const cached = this.modelCache.get(model)

    if (cached !== undefined) return cached

    const result = model.export(this)

    this.modelCache.set(model, result)

    return result
  }

  public abstract setTexture (image: HTMLCanvasElement | HTMLImageElement | null): void

  public abstract buildModelPart (part: ModelPart): TPart

  public abstract buildGeometry (geometry: QuadGeometry): TGeometry
}
