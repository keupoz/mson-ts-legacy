import { JsonElement, JsonObject } from '@keupoz/tson'
import { Tuple } from '../../Tuple'

function fill<T, N extends number> (arr: Tuple<T, N>, value: T): Tuple<T, N> {
  for (let i = 0; i < arr.length; i++) {
    arr[i] = value
  }

  return arr
}

export function accept (json: JsonObject, member: string): JsonElement | null {
  const element = json.get(member)

  if (element === null || element.isNull()) {
    return null
  }

  return element
}

export function jsonRequire (json: JsonObject, member: string, caller: string): JsonElement {
  const element = accept(json, member)

  if (element === null) {
    throw new Error(`Missing required member '${member}' in ${caller}`)
  }

  return element
}

export function acceptBoolean (json: JsonObject, member: string): boolean | null {
  const element = accept(json, member)

  if (element === null) return null

  return element.getAsBoolean()
}

export function acceptNumbers<N extends number> (json: JsonObject, member: string, output: Tuple<number, N>): Tuple<number, N> | null {
  const element = accept(json, member)

  if (element === null) return null

  return getAsNumbers(element, output)
}

export function acceptBooleans<N extends number> (json: JsonObject, member: string, output: Tuple<boolean, N>): Tuple<boolean, N> | null {
  const element = accept(json, member)

  if (element === null) return null

  return getAsBooleans(element, output)
}

export function getBooleanOr (json: JsonObject, member: string, defaultValue: boolean): boolean {
  const element = json.get(member)

  if (element === null || element.isNull() || !element.isPrimitive()) {
    return defaultValue
  }

  return element.getAsBoolean()
}

export function getNumberOr (json: JsonObject, member: string, defaultValue: number): number {
  const element = json.get(member)

  if (element === null || element.isNull() || !element.isPrimitive()) {
    return defaultValue
  }

  return element.getAsNumber()
}

export function getIntegerOr (json: JsonObject, member: string, defaultValue: number): number {
  const element = json.get(member)

  if (element === null || element.isNull() || !element.isPrimitive()) {
    return defaultValue | 0
  }

  return element.getAsInteger()
}

function getAsNumbers<N extends number> (json: JsonElement, output: Tuple<number, N>): Tuple<number, N> {
  if (!json.isArray()) {
    return fill(output, json.getAsNumber())
  }

  const arr = json.getAsArray()

  if (arr.size() !== output.length) {
    throw new Error(`Expected array of ${output.length} elements. Instead got ${arr.size()}`)
  }

  for (let i = 0; i < output.length; i++) {
    output[i] = arr.get(i).getAsNumber()
  }

  return output
}

function getAsBooleans<N extends number> (json: JsonElement, output: Tuple<boolean, N>): Tuple<boolean, N> {
  if (!json.isArray()) {
    return fill(output, json.getAsBoolean())
  }

  const arr = json.getAsArray()

  if (arr.size() !== output.length) {
    throw new Error(`Expected array of ${output.length} elements. Instead got ${arr.size()}`)
  }

  for (let i = 0; i < output.length; i++) {
    output[i] = arr.get(i).getAsBoolean()
  }

  return output
}
