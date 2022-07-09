import { JsonObject, JsonPrimitive } from '@keupoz/tson'
import { Identifier } from '../../minecraft/Identifier'
import { Tuple, Tuple3 } from '../../Tuple'
import { Incomplete } from '../api/Incomplete'
import { JsonContextLocals } from '../api/json/JsonContext'
import { Texture } from '../api/model/Texture'
import { accept, jsonRequire } from '../util/JsonUtil'
import { Local } from './Local'

function toFloats<N extends number> (input: Tuple<Incomplete<number>, N>): Incomplete<Tuple<number, N>> {
  return Incomplete.create((locals) => {
    const result = new Array(input.length) as Tuple<number, N>

    input.forEach((value, i) => {
      result[i] = value.complete(locals)
    })

    return result
  })
}

function values<N extends number> (length: N, value = Incomplete.ZERO): Tuple<Incomplete<number>, N> {
  const output = new Array(length) as Tuple<Incomplete<number>, N>

  output.fill(value)

  return output
}

export abstract class JsonLocalsImpl implements JsonContextLocals {
  public abstract getModelId (): Identifier
  public abstract getTexture (): Texture
  public abstract getDilation (): Tuple3<number>
  public abstract keys (): Set<string>

  public abstract getLocal (name: string): Incomplete<number>

  public getPrimitive (json: JsonPrimitive): Incomplete<number> {
    return Local.ref(json)
  }

  public getPrimitives <N extends number>(...arr: Tuple<JsonPrimitive, N>): Incomplete<Tuple<number, N>> {
    return toFloats(arr.map(Local.ref.bind(Local)) as Tuple<Incomplete<number>, N>)
  }

  public getMemberArray<N extends number>(json: JsonObject, member: string, length: N): Incomplete<Tuple<number, N>> {
    const arr = accept(json, member)

    if (arr === null) return toFloats(values(length))

    if (!arr.isArray()) return toFloats(values(length, Local.ref(arr.getAsPrimitive())))

    const output = new Array(length) as Tuple<Incomplete<number>, N>

    for (let i = 0; i < length && i < arr.size(); i++) {
      const current = arr.get(i)

      if (!current.isPrimitive()) {
        throw new Error(`Non-primitive type found in array for model ${this.getModelId().toString()}. Can only be values (Number) or variable references (#variable). ${arr.toString()}`)
      }

      output[i] = Local.ref(current)
    }

    return toFloats(output)
  }

  public getMember (json: JsonObject, member: string): Incomplete<number> {
    const element = jsonRequire(json, member, this.getModelId().toString())

    if (!element.isPrimitive()) {
      throw new Error(
        `Non-primitive type found in member '${member}' for model ${this.getModelId().toString()}. Can only be values (Number) or variable references (#variable). ${element.toString()}`
      )
    }

    return Local.ref(element)
  }
}
