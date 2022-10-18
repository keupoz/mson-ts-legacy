import { createNumberFormatter, getSuitableDecimalDigits, getSuitableDraggingScale, ListParamsOptions, StepConstraint } from '@tweakpane/core'
import type { FolderApi, ListApi, ListBladeParams, SliderApi, SliderBladeParams, TextApi, TextBladeParams } from 'tweakpane'

export function addTextBlade (parent: FolderApi, label: string, value: string): TextApi<string> {
  const params: TextBladeParams<string> = {
    view: 'text',
    parse: (s) => s,
    label,
    value
  }

  return parent.addBlade(params) as TextApi<string>
}

export function addSliderBlade (parent: FolderApi, label: string, min: number, max: number, step: number, value: number): SliderApi {
  const stepConstraint = new StepConstraint(step, min)
  const formatter = createNumberFormatter(getSuitableDecimalDigits(stepConstraint, value))

  const params: SliderBladeParams = {
    view: 'slider',
    label,
    min,
    max,
    value,
    format: formatter
  }

  const blade = parent.addBlade(params) as SliderApi

  blade.controller_.valueController.textController.props.set('draggingScale', getSuitableDraggingScale(stepConstraint, value))

  const bladeValue = blade.controller_.valueController.value
  const setRawValue = bladeValue.setRawValue.bind(bladeValue)

  bladeValue.setRawValue = (rawValue, options) => {
    rawValue = +formatter(stepConstraint.constrain(rawValue))

    setRawValue(rawValue, options)
  }

  return blade
}

export function addListBlade<T> (parent: FolderApi, label: string, options: ListParamsOptions<T>, value: T): ListApi<T> {
  const params: ListBladeParams<T> = {
    view: 'list',
    label,
    options,
    value
  }

  return parent.addBlade(params) as ListApi<T>
}
