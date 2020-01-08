import Point from './Point.js'

function onMove(event) {

    const { view, width, height } = this.graph
    const { clientX, clientY } = event

    const bounding = this.graph.wrapper.getBoundingClientRect()
    const x = clientX - bounding.x
    const y = clientY - bounding.y

    // if first move, initialize this
    if (!this.hasMoved) {

        this.set(x, y)
        this.hasMoved = true

    }

    const { old, delta } = this
    old.copy(this)
    this.set(x, y)
    delta.subVectors(this, old)

    if (this.down) {

        const dx = -delta.x / width * view.width
        const dy = delta.y / height * view.height
        view.offset(dx, dy)
        this.graph.draw()

    }

    this.graph.wrapper.dispatchEvent(new CustomEvent('move'))

}

function onDown(event) {

    this.down = true

    window.addEventListener('mouseup', this.onUp)
    this.graph.wrapper.dispatchEvent(new CustomEvent('down'))

}

function onUp(event) {

    this.down = false

    window.removeEventListener('mouseup', this.onUp)
    this.graph.wrapper.dispatchEvent(new CustomEvent('up'))

}

class Pointer extends Point {

    constructor(graph) {

        super()
        this.graph = graph
        this.old = new Point()
        this.delta = new Point()

        this.onMove = onMove.bind(this)
        this.onDown = onDown.bind(this)
        this.onUp = onUp.bind(this)

        graph.wrapper.addEventListener('mousemove', this.onMove)
        graph.wrapper.addEventListener('mousedown', this.onDown)

    }

}

export default Pointer
