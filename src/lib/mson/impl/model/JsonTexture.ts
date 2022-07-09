import { JsonElement } from '@keupoz/tson'
import { Incomplete } from '../../api/Incomplete'
import { Texture } from '../../api/model/Texture'
import { getIntegerOr } from '../../util/JsonUtil'

export const fromParent = Incomplete.create((locals) => locals.getTexture())

export function incompleteTexture (json: JsonElement | null): Incomplete<Texture> {
  if (json === null) return fromParent

  return merged(json)
}

export function unlocalizedTexture (json: JsonElement | null, inherited: Texture): Texture {
  if (json === null) return inherited

  return of(json, inherited)
}

export function textureOf (json: JsonElement): Texture {
  return of(json, Texture.EMPTY)
}

function merged (el: JsonElement): Incomplete<Texture> {
  return Incomplete.create((locals) => {
    return of(el, locals.getTexture())
  })
}

function of (json: JsonElement, inherited: Texture): Texture {
  const tex = json.getAsObject()

  return new Texture(
    getIntegerOr(tex, 'u', inherited.getU()),
    getIntegerOr(tex, 'v', inherited.getV()),
    getIntegerOr(tex, 'w', inherited.getWidth()),
    getIntegerOr(tex, 'h', inherited.getHeight())
  )
}
