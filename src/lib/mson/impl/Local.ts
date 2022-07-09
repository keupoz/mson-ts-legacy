import { JsonArray, JsonElement, JsonPrimitive } from '@keupoz/tson'
import { Incomplete } from '../api/Incomplete'
import { ModelContextLocals } from '../api/ModelContext'

type Operation = (one: number, two: number) => number

const OPERATIONS = new Map<string, Operation>()

OPERATIONS.set('+', (one, two) => one + two)
OPERATIONS.set('-', (one, two) => one - two)
OPERATIONS.set('*', (one, two) => one * two)
OPERATIONS.set('/', (one, two) => one / two)
OPERATIONS.set('%', (one, two) => one % two)
OPERATIONS.set('^', (one, two) => one ** two)

function getOperation (operator: string): Operation {
  const operation = OPERATIONS.get(operator)

  if (operation === undefined) {
    const expected = Array.prototype.join.call(OPERATIONS.keys(), ', ')

    throw new Error(`Invalid operation '${operator}'. Expected one of ${expected}`)
  }

  return operation
}

export class Local extends Incomplete<number> {
  private readonly operation: Operation
  private readonly left: Incomplete<number>
  private readonly right: Incomplete<number>

  private constructor (tokens: JsonArray) {
    super()

    if (tokens.size() !== 3) {
      throw new Error(`Saw a local of ${tokens.size()} members. Expected 3 of (left, op, right).`)
    }

    this.operation = getOperation(tokens.get(1).getAsString())
    this.left = Local.createLocal(tokens.get(0))
    this.right = Local.createLocal(tokens.get(2))
  }

  public complete (locals: ModelContextLocals): number {
    return this.operation(this.left.complete(locals), this.right.complete(locals))
  }

  public static createLocal (json: JsonElement): Incomplete<number> {
    if (json.isPrimitive()) {
      return this.ref(json)
    }

    if (json.isArray()) {
      return new Local(json)
    }

    throw new Error('Unsupported local type. A local must be either a value (number) string (#variable) or an array')
  }

  public static of (json: JsonElement | null): Block {
    const locals = new Map<string, Incomplete<number>>()

    if (json !== null) {
      for (const [key, value] of json.getAsObject().entries()) {
        locals.set(key, this.createLocal(value))
      }
    }

    return new Block(locals)
  }

  public static ref (prim: JsonPrimitive): Incomplete<number> {
    if (prim.isNumber()) {
      return Incomplete.completed(prim.getAsNumber())
    }

    if (prim.isString()) {
      let variableName = prim.getAsString()

      if (variableName.startsWith('#')) {
        variableName = variableName.substring(1)
        return Incomplete.create((locals) => locals.getLocal(variableName))
      }

      return Incomplete.ZERO
    }

    throw new Error(`Unsupported local value type: ${prim.toString()}`)
  }
}

export class Block {
  private readonly locals: Map<string, Incomplete<number>>

  constructor (locals: Map<string, Incomplete<number>>) {
    this.locals = locals
  }

  public entries (): Map<string, Incomplete<number>> {
    return this.locals
  }

  public appendKeys (output: Set<string>): Set<string> {
    for (const key of this.locals.keys()) {
      output.add(key)
    }

    return output
  }

  public get (name: string): Incomplete<number> | null {
    return this.locals.get(name) ?? null
  }
}
