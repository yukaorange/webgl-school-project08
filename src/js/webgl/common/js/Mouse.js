export class Mouse {
  constructor() {
    this.mouseMoved = false
    this.coords = { x: 0, y: 0 }
    this.delta = { x: 0, y: 0 }
    this.diff = { x: 0, y: 0 }
    this.current = { x: 0, y: 0 }
    this.timer = null
  }

  init() {
    document.body.addEventListener(
      'mousemove',
      (event) => {
        this.onDocumentMouseMove(event)
      },
      false,
    )
    document.body.addEventListener(
      'touchstart',
      (event) => {
        this.onDocumentTouchStart(event)
      },
      false,
    )
    document.body.addEventListener(
      'touchmove',
      (event) => {
        this.onDocumentTouchMove(event)
      },
      false,
    )
  }

  setCoords(x, y) {
    if (this.timer) clearTimeout(this.timer)
    this.coords.x = (x / window.innerWidth) * 2 - 1
    this.coords.y = -(y / window.innerHeight) * 2 + 1
    this.mouseMoved = true

    this.timer = setTimeout(() => {
      this.mouseMoved = false
    }, 100)
  }

  onDocumentMouseMove(event) {
    this.setCoords(event.clientX, event.clientY)
  }

  onDocumentTouchStart(event) {
    if (event.touches.length === 1) {
      this.setCoords(event.touches[0].pageX, event.touches[0].pageY)
    }
  }

  onDocumentTouchMove(event) {
    if (event.touches.length === 1) {
      this.setCoords(event.touches[0].pageX, event.touches[0].pageY)
    }
  }

  update() {
    const easing = 0.05
    // 現在のマウス座標と前回の座標の差分を計算
    const deltaX = this.coords.x - this.current.x
    const deltaY = this.coords.y - this.current.y

    // currentにイージングを適用して更新
    this.current.x += deltaX * easing
    this.current.y += deltaY * easing
  }
}
