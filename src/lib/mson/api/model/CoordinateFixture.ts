import { Axis } from './Face'

export class CoordinateFixture {
  public static readonly NULL = new CoordinateFixture()

  // @ts-expect-error noUnusedParameters
  protected isFixed (axis: Axis, x: number, y: number, z: number): boolean {
    return false
  }

  public stretchCoordinate (axis: Axis, x: number, y: number, z: number, stretch: number): number {
    return this.getValue(axis, x, y, z) + (this.isFixed(axis, x, y, z) ? -stretch : stretch)
  }

  private getValue (axis: Axis, x: number, y: number, z: number): number {
    switch (axis) {
      case Axis.X: return x
      case Axis.Y: return y
      case Axis.Z: return z
      default: return 0
    }
  }
}
