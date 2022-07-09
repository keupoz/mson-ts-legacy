import { MsonModel } from './mson/api/MsonModel'
import { hashCode } from './Utils'

export function createTemplate (model: MsonModel, multiplier: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (ctx === null) {
    throw new Error('Can\'t create 2D context')
  }

  const parentTexture = model.getTexture()

  canvas.width = parentTexture.getWidth() * multiplier
  canvas.height = parentTexture.getHeight() * multiplier

  let i = 0

  for (const chunk of model.exportTextures()) {
    if (i++ === 1) break

    for (const texture of chunk.getChildren()) {
      ctx.fillStyle = `#${hashCode(texture.toString()) & 0xffffff}`
      ctx.fillRect(texture.getU() * multiplier, texture.getV() * multiplier, texture.getWidth() * multiplier, texture.getHeight() * multiplier)
    }
  }

  return canvas
}
