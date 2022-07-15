import { ThreeConverter } from '../lib/3d/ThreeConverter'
import { ModelManager } from '../lib/ModelManager'
import { Implementation } from '../lib/mson/api/MsonModel'
import { FetchResourceManager } from '../lib/ResourceManager'
import { Renderer } from './Renderer'
import { UnicornHorn } from './UnicornHorn'

void (async () => {
  const resourceManager = new FetchResourceManager('/assets/mson')
  const manager = new ModelManager(resourceManager, ThreeConverter)

  Implementation.register('com.minelittlepony.client.model.part.UnicornHorn', UnicornHorn)

  const entry1 = await manager.getModel('minelittlepony:allay')
  // const entry2 = await manager.getModel('minelittlepony:armour_inner')
  // const entry3 = await manager.getModel('minelittlepony:armour_outer')

  const model1 = await entry1.createModel()
  // const model2 = await entry2.createModel()
  // const model3 = await entry3.createModel()

  const object1 = entry1.build(model1)
  // const object2 = entry2.build(model2)
  // const object3 = entry3.build(model3)

  const renderer = new Renderer()

  document.body.appendChild(renderer.getDomElement())

  renderer.addObject(object1)
  // renderer.addObject(object2)
  // renderer.addObject(object3)

  renderer.updateSize()

  await entry1.setTexture('minelittlepony:textures/entity/allay/pony/allay_pony.png')
  // await entry2.setTexture('minelittlepony:textures/models/armor/diamond_layer_inner_pony.png')
  // await entry3.setTexture('minelittlepony:textures/models/armor/diamond_layer_outer_pony.png')

  renderer.render()

  window.addEventListener('resize', () => {
    renderer.updateSize()
  })
})()
