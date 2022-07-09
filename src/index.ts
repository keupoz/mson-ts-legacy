import { MsonLoader } from './lib/MsonLoader'
import { Renderer } from './lib/Renderer'
import { UnicornHorn } from './UnicornHorn'

void (async () => {
  const loader = new MsonLoader('/assets/mson')

  loader.registerImplementation('com.minelittlepony.client.model.part.UnicornHorn', UnicornHorn)

  const file1 = await loader.getFile('minelittlepony:races/steve/unicorn')
  // const file2 = await loader.getFile('minelittlepony:gear/antlers')

  const model1 = await file1.createModel()
  // const model2 = await file2.createModel()

  await loader.waitForFiles()

  const renderer = new Renderer()
  document.body.appendChild(renderer.getDomElement())

  renderer.addModel(model1)
  // renderer.addModel(model2)
  renderer.updateSize()

  console.log(model1.getTree())
  console.log(model1.export())

  await model1.setTexture('community:twilight_sparkle', 'entity')
  // await model2.setTexture('minelittlepony:antlers', 'models')

  renderer.render()

  window.addEventListener('resize', () => {
    renderer.updateSize()
  })
})()
