import { ModelPart } from '../../minecraft/ModelPart'
import { CommonLocals } from './CommonLocals'
import { MsonModel } from './MsonModel'

export type TreeChild = ModelPart | MsonModel

export interface ModelContext {
  getRoot: () => ModelContext
  getModel: () => MsonModel
  getContext: () => unknown
  getLocals: () => ModelContextLocals
  computeIfAbsent: <T>(name: string, supplier: (key: string) => T) => T
  getTree: (tree: Map<string, TreeChild>, context?: ModelContext) => void
  findByName: <T> (name: string, context?: ModelContext) => T
  resolve: (child: unknown, locals?: ModelContextLocals) => ModelContext
}

export interface ModelContextLocals extends CommonLocals {
  getLocal: (name: string) => number
  toString: () => string
}
