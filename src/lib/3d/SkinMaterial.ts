import { AddEquation, CustomBlending, DoubleSide, MeshBasicMaterial, MeshLambertMaterial, NearestFilter, OneFactor, RepeatWrapping, SrcAlphaFactor, Texture, UVMapping } from 'three'

export class HornGlowMaterial extends MeshBasicMaterial {
  constructor () {
    super({
      name: 'glow',

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
  private readonly image: HTMLCanvasElement | HTMLImageElement | null
  private readonly lastWidth: number
  private readonly lastHeight: number

  constructor () {
    super({
      name: 'skin',
      /*
       * 0.001 is lower than minimal possible value (1/255 ~= 0.003)
       * This fixes transparency overlap when top
       * transparent element erases everything underneath it
       */
      alphaTest: 0.1,
      color: 0xffffff,
      side: DoubleSide,
      transparent: true
    })

    this.image = null
    this.lastWidth = 0
    this.lastHeight = 0

    this.update()
  }

  public update (): void {
    if (this.map !== null) {
      // Texture size cannot be changed since r134,
      // so the texture has to be reinitialized each time
      // https://github.com/mrdoob/three.js/wiki/Migration-Guide#134--135

      if (this.sizeChanged()) {
        this.setTexture(this.image)
      } else {
        this.map.needsUpdate = true
      }
    }
  }

  public setTexture (image: HTMLCanvasElement | HTMLImageElement | null): void {
    if (image === null) {
      this.map = null

      return
    }

    this.map = new Texture(
      image,
      UVMapping,
      RepeatWrapping,
      RepeatWrapping,
      NearestFilter,
      NearestFilter
    )

    this.map.premultiplyAlpha = true
    this.map.needsUpdate = true
  }

  private sizeChanged (): boolean {
    if (this.image === null) {
      return false
    }

    return this.lastWidth !== this.image.width || this.lastHeight !== this.image.height
  }
}
