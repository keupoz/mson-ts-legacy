export class Texture {
  public static readonly EMPTY = new Texture(0, 0, 64, 32)

  private readonly u: number
  private readonly v: number
  private readonly width: number
  private readonly height: number

  constructor (u: number, v: number, width: number, height: number) {
    this.u = u
    this.v = v
    this.width = width
    this.height = height
  }

  public getU (): number {
    return this.u
  }

  public getV (): number {
    return this.v
  }

  public getWidth (): number {
    return this.width
  }

  public getHeight (): number {
    return this.height
  }

  public toString (): string {
    return `[JsonTexture u=${this.u} v=${this.v} w=${this.width} h=${this.height}]`
  }
}

export class TextureChunk {
  private readonly children: Set<Texture>

  constructor () {
    this.children = new Set()
  }

  public addChild (child: Texture): void {
    this.children.add(child)
  }

  public getChildren (): IterableIterator<Texture> {
    return this.children.values()
  }
}
