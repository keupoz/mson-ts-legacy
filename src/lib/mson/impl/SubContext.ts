import { ModelContext, ModelContextLocals, TreeChild } from '../api/ModelContext'
import { MsonModel } from '../api/MsonModel'

export class SubContext implements ModelContext {
  private readonly parent: ModelContext
  private readonly locals: ModelContextLocals
  private readonly context: unknown

  constructor (parent: ModelContext, locals: ModelContextLocals, context: unknown) {
    this.parent = parent
    this.locals = locals
    this.context = context
  }

  public getModel (): MsonModel {
    return this.parent.getModel()
  }

  public getContext (): unknown {
    return this.context
  }

  public getTree (tree: Map<string, TreeChild>, context?: ModelContext): void {
    this.parent.getTree(tree, context)
  }

  public findByName <T>(name: string, context?: ModelContext): T {
    return this.parent.findByName(name, context)
  }

  public computeIfAbsent <T>(name: string, supplier: (key: string) => T): T {
    return this.parent.computeIfAbsent(name, supplier)
  }

  public resolve (child: unknown, locals: ModelContextLocals = this.getLocals()): ModelContext {
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
