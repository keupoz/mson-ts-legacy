import { ExportResult, JsonComponent } from '../../api/json/JsonComponent'
import { ModelContext } from '../../api/ModelContext'

export class JsonLink extends JsonComponent {
  private readonly linkName: string

  constructor (name: string) {
    super()

    if (!name.startsWith('#')) {
      throw new Error('Link name should begin with a "#".')
    }

    this.linkName = name.substring(1)
  }

  public export (context: ModelContext): ExportResult {
    return context.computeIfAbsent(this.linkName, (key) => {
      return context.findByName(context, key)
    })
  }
}
