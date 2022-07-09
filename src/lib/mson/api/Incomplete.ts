import { ModelContext, ModelContextLocals } from './ModelContext'

export abstract class Incomplete<T> {
  public static readonly ZERO = Incomplete.completed(0)

  public static create<T>(
    complete: (locals: ModelContextLocals) => T
  ): Incomplete<T> {
    return new (class extends Incomplete<T> {
      public complete (locals: ModelContextLocals): T {
        return complete(locals)
      }
    })()
  }

  public static completed<T>(value: T): Incomplete<T> {
    return new (class extends Incomplete<T> {
      public complete (): T {
        return value
      }
    })()
  }

  public abstract complete (locals: ModelContextLocals): T

  public resolve (context: ModelContext): T {
    return this.complete(context.getLocals())
  }
}
