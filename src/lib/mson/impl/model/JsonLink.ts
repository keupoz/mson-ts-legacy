import { JsonComponent } from '../../api/json/JsonComponent'
import { ModelContext } from '../../api/ModelContext'

export class JsonLink extends JsonComponent<unknown> {
  private readonly linkName: string

  constructor (name: string) {
    if (!name.startsWith('#')) {
      throw new Error('Link name should begin with a "#".')
    }

    super()

    this.linkName = name.substring(1)
  }

  public export (context: ModelContext): unknown {
    return context.computeIfAbsent(this.linkName, context.findByName.bind(context))
  }
}
