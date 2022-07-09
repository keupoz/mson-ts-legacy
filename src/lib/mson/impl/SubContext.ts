import { ExportResult } from '../api/json/JsonComponent'
import { ExtraContext, ModelContext, ModelContextLocals, TreeChild } from '../api/ModelContext'
import { MsonModel } from '../api/MsonModel'

export class SubContext implements ModelContext {
  private readonly parent: ModelContext
  private readonly locals: ModelContextLocals
  private readonly context: ExtraContext

  constructor (parent: ModelContext, locals: ModelContextLocals, context: ExtraContext) {
    this.parent = parent
    this.locals = locals
    this.context = context
  }

  public getModel (): MsonModel {
    return this.parent.getModel()
  }

  public getContext (): ExtraContext {
    return this.context
  }

  public getTree (context: ModelContext, tree: Map<string, TreeChild>): void {
    this.parent.getTree(context, tree)
  }

  public findByName (context: ModelContext, name: string): ExportResult {
    return this.parent.findByName(context, name)
  }

  public computeIfAbsent<T extends ExportResult> (name: string, supplier: (key: string) => T): T {
    return this.parent.computeIfAbsent(name, supplier)
  }

  public resolve (child: ExtraContext, locals: ModelContextLocals): ModelContext {
    if (child === this.getContext() && locals === this.getLocals()) {
      return this
    }

    return new SubContext(this.parent, locals, child)
  }

  public getRoot (): ModelContext {
    return this.parent.getRoot()
  }

  public getLocals (): ModelContextLocals {
    return this.locals
  }
}
