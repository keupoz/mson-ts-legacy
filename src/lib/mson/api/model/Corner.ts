import { Vector3 } from 'three'

export class Corner {
  public static readonly CORNERS = [
    new Vector3(0, 0, 0),
    new Vector3(0, 0, 1),
    new Vector3(0, 1, 0),
    new Vector3(0, 1, 1),
    new Vector3(1, 0, 0),
    new Vector3(1, 0, 1),
    new Vector3(1, 1, 0),
    new Vector3(1, 1, 1)
  ]

  private readonly normal: Vector3
  private readonly stretched: Vector3

  constructor (normal: Vector3, stretched: Vector3) {
    this.normal = normal
    this.stretched = stretched
  }

  public getNormalVector (): Vector3 {
    return this.normal.clone()
  }

  public getStretchedVector (): Vector3 {
    return this.stretched.clone()
  }
}
