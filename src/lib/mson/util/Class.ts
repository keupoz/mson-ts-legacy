export type Class<T, V extends any[] = any[]> = new (...args: V) => T

export interface Stringifiable {
  toString: () => string
}

export class NullClass {
  private constructor () {}

  public noop (): void {}
}
