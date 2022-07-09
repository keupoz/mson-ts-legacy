import { JsonObject } from '@keupoz/tson'
import { ModelPart } from '../../../ModelPart'
import { QuadGeometry } from '../../../QuadGeometry'
import { ModelContext } from '../ModelContext'
import { MsonModel } from '../MsonModel'
import { JsonContext } from './JsonContext'

export type ExportResult = MsonModel | ModelPart | QuadGeometry

export type JsonComponentFactory = new (context: JsonContext, name: string, json: JsonObject) => JsonComponent

export type TryExportTypeFactory<T extends ExportResult> = new (...args: any[]) => T

export abstract class JsonComponent {
  public tryExport<T extends ExportResult>(context: ModelContext, type: TryExportTypeFactory<T>): T | null {
    const s = this.export(context)

    return s instanceof type ? s : null
  }

  public abstract export (context: ModelContext): ExportResult
}
