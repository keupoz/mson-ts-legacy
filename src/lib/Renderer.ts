import { AmbientLight, BoxHelper, DirectionalLight, Intersection, Object3D, PerspectiveCamera, Raycaster, Scene, Vector2, Vector3, WebGLRenderer } from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { MsonModel } from './mson/api/MsonModel'

interface PointerInfo {
  clientX: number
  clientY: number
}

export class Renderer {
  private readonly renderer: WebGLRenderer
  private readonly scene: Scene
  private readonly camera: PerspectiveCamera
  private readonly controls: OrbitControls
  private readonly ambientLight: AmbientLight
  private readonly directionalLight: DirectionalLight

  private readonly pointerVector: Vector2
  private readonly raycaster: Raycaster
  private readonly highlight: BoxHelper

  private currentIntersection: Intersection | null

  private readonly intersectables: Set<Object3D>

  constructor () {
    this.renderer = new WebGLRenderer({ alpha: false })
    this.scene = new Scene()
    this.camera = new PerspectiveCamera(45, 1, 0.1, 500)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.ambientLight = new AmbientLight(0x7f7f7f)
    this.directionalLight = new DirectionalLight(0x7f7f7f)

    this.pointerVector = new Vector2()
    this.raycaster = new Raycaster()
    this.highlight = new BoxHelper(new Object3D(), 0xffffff)

    this.currentIntersection = null

    this.intersectables = new Set()

    this.camera.position.set(32, 16, 32)
    this.directionalLight.position.copy(this.camera.position)
    this.camera.lookAt(0, 0, 0)
    this.directionalLight.lookAt(0, 0, 0)

    this.controls.listenToKeyEvents(window)
    this.controls.zoomSpeed = 2

    this.raycaster.params.Points = {
      threshold: 0
    }

    this.raycaster.params.Line = {
      threshold: 0
    }

    this.controls.addEventListener('change', () => {
      this.directionalLight.position.copy(this.camera.position)
      this.render()
    })

    this.renderer.domElement.addEventListener('mousemove', (e) => {
      this.updatePointer(e)
    })

    this.renderer.domElement.addEventListener('touchmove', (e) => {
      const touch = e.changedTouches[0]

      if (touch === undefined) {
        throw new Error('Unexpected condition')
      }

      this.updatePointer(touch)
    })

    this.renderer.domElement.addEventListener('dblclick', (e) => {
      e.preventDefault()

      this.updateFocus()
    })

    this.renderer.domElement.addEventListener('click', (e) => {
      e.preventDefault()

      if (this.currentIntersection !== null) {
        console.log(this.currentIntersection.object)
      }
    })

    this.scene.add(this.ambientLight, this.directionalLight)
  }

  public getDomElement (): HTMLCanvasElement {
    return this.renderer.domElement
  }

  public updateSize (): void {
    const canvas = this.renderer.domElement
    let el = canvas.parentElement

    if (el === null) {
      el = canvas
    }

    this.setSize(el.offsetWidth, el.offsetHeight)
  }

  public setSize (width: number, height: number): void {
    this.renderer.setSize(width, height)
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()

    this.render()
  }

  public addModel (model: MsonModel): void {
    this.scene.add(model.export())

    for (const intersectable of model.getIntersectables()) {
      this.intersectables.add(intersectable)
    }
  }

  public removeModel (model: MsonModel): void {
    this.scene.remove(model.export())

    for (const intersectable of model.getIntersectables()) {
      this.intersectables.delete(intersectable)
    }
  }

  public render (): void {
    this.renderer.render(this.scene, this.camera)
  }

  private updateFocus (): void {
    if (this.currentIntersection === null) {
      this.resetFocus()

      return
    }

    this.setFocus(this.getHighlightCenter())
  }

  private resetFocus (): void {
    this.setFocus(new Vector3())
  }

  private setFocus (target: Vector3): void {
    this.controls.target.copy(target)
    this.directionalLight.lookAt(target)
    this.controls.update()
  }

  private updatePointer (pointer: PointerInfo): void {
    const { top, left, width, height } = this.renderer.domElement.getBoundingClientRect()

    this.pointerVector.x = (pointer.clientX - left) / width * 2 - 1
    this.pointerVector.y = -(pointer.clientY - top) / height * 2 + 1

    this.updateHighlight()
  }

  private updateHighlight (): void {
    this.raycaster.setFromCamera(this.pointerVector, this.camera)

    const intersection = this.raycaster.intersectObjects([...this.intersectables], false)[0]

    if (intersection === undefined) {
      this.scene.remove(this.highlight)
      this.currentIntersection = null
    } else {
      this.highlight.setFromObject(intersection.object).update()
      this.scene.add(this.highlight)
      this.currentIntersection = intersection
    }

    this.render()
  }

  private getHighlightCenter (): Vector3 {
    let boundingSphere = this.highlight.geometry.boundingSphere

    if (boundingSphere === null) {
      this.highlight.geometry.computeBoundingSphere()

      boundingSphere = this.highlight.geometry.boundingSphere
    }

    if (boundingSphere === null) {
      throw new Error("Can't compute highlight bounding sphere")
    }

    return boundingSphere.center
  }
}
