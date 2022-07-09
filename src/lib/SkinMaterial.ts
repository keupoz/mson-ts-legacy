import { AddEquation, CustomBlending, DoubleSide, MeshBasicMaterial, MeshLambertMaterial, NearestFilter, OneFactor, RepeatWrapping, SrcAlphaFactor, Texture, UVMapping } from 'three'

export class HornGlowMaterial extends MeshBasicMaterial {
  constructor () {
    super({
      color: 0xec4389,

      blending: CustomBlending,
      blendEquation: AddEquation,
      blendSrc: SrcAlphaFactor,
      blendDst: OneFactor,

      transparent: true,
      opacity: 0.4,
      side: DoubleSide
    })
  }
}

export class SkinMaterial extends MeshLambertMaterial {
  public override map!: Texture

  private readonly canvas: HTMLCanvasElement
  private readonly ctx: CanvasRenderingContext2D

  constructor () {
    super({
      /*
       * 0.001 is lower than minimal possible value (1/255 ~= 0.003)
       * This fixes transparency overlap when top
       * transparent element erases everything underneath it
       */
      alphaTest: 0.1,
      side: DoubleSide,
      transparent: true
    })

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (ctx === null) {
      throw new Error('Can\'t create 2D canvas context')
    }

    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    this.canvas = canvas
    this.ctx = ctx

    this.initTexture()
    this.update()
  }

  public update (): void {
    this.map.needsUpdate = true
  }

  public getRenderingContext (): CanvasRenderingContext2D {
    return this.ctx
  }

  public drawImage (image: HTMLImageElement): void {
    this.ctx.canvas.width = image.width
    this.ctx.canvas.height = image.height

    this.ctx.clearRect(0, 0, image.width, image.height)
    this.ctx.drawImage(image, 0, 0)

    this.initTexture()
    this.update()
  }

  private initTexture (): void {
    // Texture size cannot be changed since r134,
    // so the texture has to be reinitialized each time
    // https://github.com/mrdoob/three.js/wiki/Migration-Guide#134--135
    this.map = new Texture(
      this.canvas,
      UVMapping,
      RepeatWrapping,
      RepeatWrapping,
      NearestFilter,
      NearestFilter
    )

    this.map.premultiplyAlpha = true
  }
}
