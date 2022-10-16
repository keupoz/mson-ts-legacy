import { JsonElement, JsonObject } from '@keupoz/tson'
import { Identifier } from '../../../minecraft/Identifier'
import { ModelPart } from '../../../minecraft/ModelPart'
import { QuadGeometry } from '../../../QuadGeometry'
import { JsonComponent } from '../../api/json/JsonComponent'
import { JsonContext } from '../../api/json/JsonContext'
import { PartBuilder } from '../../api/model/PartBuilder'
import { ModelContext } from '../../api/ModelContext'
import { MsonModel } from '../../api/MsonModel'
import { accept } from '../../util/JsonUtil'
import { AbstractJsonParent } from './AbstractJsonParent'
import { JsonBox } from './JsonBox'

export class JsonCompound extends AbstractJsonParent {
  public static readonly ID = new Identifier('mson', 'compound')

  private readonly children = new Map<string, JsonComponent>()
  private readonly cubes = new Set<JsonComponent>()

  constructor (context: JsonContext, name: string, json: JsonObject) {
    super(context, name, json)

    const children = accept(json, 'children')
    const cubes = accept(json, 'cubes')

    if (children !== null) {
      for (const [key, value] of this.parseChildren(children)) {
        const component = context.loadComponent(`${name}.${key}`, value, JsonCompound.ID)

        if (component !== null) {
          this.children.set(key, component)
        }
      }
    }

    if (cubes !== null) {
      let i = 0

      for (const element of cubes.getAsArray().iterator()) {
        const component = context.loadComponent(`${name}.cube${i++}`, element, JsonBox.ID)

        if (component !== null) {
          this.cubes.add(component)
        }
      }
    }
  }

  private * parseChildren (json: JsonElement): IterableIterator<[string, JsonElement]> {
    if (json.isObject()) {
      yield * json.entries()
    }
  }

  protected override exportBuilder (context: ModelContext, builder: PartBuilder): PartBuilder {
    super.exportBuilder(context, builder)

    for (const [key, value] of this.children) {
      const part = value.export(context)

      if (part instanceof MsonModel || part instanceof ModelPart) {
        builder.addChild(key, part)
      }
    }

    for (const value of this.cubes) {
      const cube = value.tryExport(context, QuadGeometry)

      if (cube !== null) {
        builder.addCube(cube)
      }
    }

    return builder
  }
}
