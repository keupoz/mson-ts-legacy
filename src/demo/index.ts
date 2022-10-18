import { ListItem } from '@tweakpane/core'
import { Pane } from 'tweakpane'
import { ThreeConverter } from '../lib/3d/ThreeConverter'
import { Identifier } from '../lib/minecraft/Identifier'
import { ModelManager } from '../lib/ModelManager'
import { Implementation } from '../lib/mson/api/MsonModel'
import { FetchResourceManager } from '../lib/ResourceManager'
import { Renderer } from './Renderer'
import { UnicornHorn } from './UnicornHorn'
import { addListBlade } from './utils/blades'

function processGlobResult (input: Record<string, string>): Record<string, string> {
  const commonRegexp = /^\/assets\/mson\/(\w+)\/(.*)/
  const output: Record<string, string> = {}

  for (const [key, value] of Object.entries(input)) {
    const match = key.match(commonRegexp)

    if (match === null) {
      throw new Error('Can\'t match string')
    }

    const [, namespace, path] = match

    if (namespace === undefined || path === undefined) {
      throw new Error('Empty match result')
    }

    output[`${namespace}:${path}`] = value
  }

  return output
}

function resourceMapToList (input: Record<string, string>, models: boolean): Array<ListItem<string>> {
  const modelsRegexp = /^models\/(.*).json$/

  return Object.keys(input).map<ListItem<string>>((value) => {
    if (models) {
      const id = Identifier.of(value)
      const match = id.getPath().match(modelsRegexp)?.[1]

      if (match === undefined) {
        throw new Error('Can\'t match model path')
      }

      value = `${id.getNamespace()}:${match}`
    }

    return { text: value, value }
  })
}

const RESOURCES_PATH = '/assets/mson'

const MODELS = processGlobResult(import.meta.glob('/assets/mson/**/models/**/*.json', { eager: true, as: 'url' }))
const TEXTURES = processGlobResult(import.meta.glob('/assets/mson/**/textures/**/*.png', { eager: true, as: 'url' }))

void (async () => {
  const resourceManager = new FetchResourceManager(RESOURCES_PATH, Object.assign({}, MODELS, TEXTURES))
  const manager = new ModelManager(resourceManager, ThreeConverter)

  Implementation.register('com.minelittlepony.client.model.part.UnicornHorn', UnicornHorn)

  async function addModel (modelId: string, textureId: string): Promise<void> {
    const entry = await manager.getModel(modelId)
    const model = await entry.createModel()
    const object = entry.build(model)

    await entry.setTexture(textureId)
    renderer.addObject(object)

    const folder = gui.addFolder({ title: modelId })

    addListBlade(folder, 'Texture', texturesItemList, textureId).on('change', (e) => {
      void entry.setTexture(e.value)
        .then(() => renderer.render())
    })

    folder.addButton({ title: 'Remove' }).on('click', () => {
      gui.remove(folder)
      renderer.removeObject(object)
      renderer.render()
    })
  }

  const gui = new Pane({ title: 'Controls' })

  const modelsItemList = resourceMapToList(MODELS, true)
  const texturesItemList = resourceMapToList(TEXTURES, false)

  const modelBlade = addListBlade(gui, 'Model', modelsItemList, modelsItemList[0]?.value ?? '')
  const textureBlade = addListBlade(gui, 'Texture', texturesItemList, texturesItemList[0]?.value ?? '')

  gui.addButton({ title: 'Add model' }).on('click', () => {
    void addModel(modelBlade.value, textureBlade.value)
  })

  const renderer = new Renderer()

  await addModel('minelittlepony:races/steve/pegasus', 'minelittlepony:textures/entity/steve_pony.png')

  document.body.appendChild(renderer.getDomElement())
  renderer.updateSize()

  window.addEventListener('resize', () => {
    renderer.updateSize()
  })
})()
