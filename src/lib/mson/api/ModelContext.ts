import { ModelPart } from '../../ModelPart'
import { CommonLocals } from './CommonLocals'
import { ExportResult } from './json/JsonComponent'
import { BoxBuilder } from './model/BoxBuilder'
import { PartBuilder } from './model/PartBuilder'
import { MsonModel } from './MsonModel'

export type ExtraContext = MsonModel | PartBuilder | BoxBuilder
export type TreeChild = MsonModel | ModelPart

export interface ModelContext {
  getRoot: () => ModelContext
  getModel: () => MsonModel
  getContext: () => ExtraContext
  getLocals: () => ModelContextLocals
  computeIfAbsent: <T extends ExportResult>(name: string, supplier: (key: string) => T) => T
  getTree: (context: ModelContext, tree: Map<string, TreeChild>) => void
  findByName: (context: ModelContext, name: string) => ExportResult
  resolve: (child: ExtraContext, locals: ModelContextLocals) => ModelContext
}

export interface ModelContextLocals extends CommonLocals {
  getLocal: (name: string) => number
  toString: () => string
}
