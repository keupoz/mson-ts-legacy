import { Pane } from 'tweakpane'
import { addTextBlade } from './utils/blades'

export class GUI {
  public readonly root = new Pane({ title: 'Controls' })

  public init (): void {
    addTextBlade(this.root, 'Test', 'Test').on('change', (e) => {
      console.log(e.value)
    })
  }
}
