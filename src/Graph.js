import Rectangle from './Rectangle.js'
import Layer from './Layer.js'
import Pointer from './Pointer.js'
import style from './style.js'
import * as Draw from './Draw.js'
import { dosvg, enumerate, removeLineHeadingSpaces } from './helpers.js'

class Graph {

    constructor(element) {

        const wrapper = document.createElement('div')
        wrapper.classList.add('graph-wrapper')

        const width = 400, height = 400
        const svg = dosvg('svg', { width, height, parent:wrapper })
        const view = new Rectangle(-4, -4, 8, 8)

        Object.assign(this, { wrapper, svg, view })

        const border = dosvg('rect', { parent:svg, fill:'none', stroke:'black' })
        const layers = Layer.getLayersProxy(this)
        const pointer = new Pointer(this)

        Object.assign(this, { border, layers, pointer })

        this.setSize(width, height)

        if (element)
            this.init(element)

        wrapper.addEventListener('mousemove', (e) => {

            let { offsetX:mouseX, offsetY:mouseY } = e
            mouseX /= width
            mouseY /= height
            mouseX = view.localX(mouseX)
            mouseY = view.localX(1 - mouseY)
            Object.assign(this, { mouseX, mouseY })

            svg.dispatchEvent(new CustomEvent('move'))

        })

    }

    setSize(width, height) {

        const { wrapper, svg, border, view, canvas } = this

        Object.assign(this, { width, height })
        dosvg(svg, { width, height })
        dosvg(border, { x:.5, y:.5, width:width - 1, height:height - 1 })

        wrapper.style.width = `${width}px`
        wrapper.style.height = `${height}px`

        for (const canvas of wrapper.querySelectorAll('canvas'))
            canvas.shaderCanvas.setSize(width, height)

        this.draw()

    }

    init(element) {

        if (element.hasAttribute('view')) {

            const rect = element.getAttribute('view').split(',').map(i => parseFloat(i))
            this.view.set(...rect)

        }

        if (element.hasAttribute('size')) {

            const [width, height] = element.getAttribute('size').split(',').map(i => parseInt(i))
            this.setSize(width, height)

        }

        const { border } = this
        dosvg(border, { stroke:element.getAttribute('border') })

        for (let child of element.children) {

            // child.style.display = 'none'

            const { localName:name } = child
            const text = removeLineHeadingSpaces(child.innerText)
            child.innerText = text

            const params = /func|point/.test(name)
                ? new Function(`return [${text}]`)()
                : [text]

            const { blend, ...props } = [...child.attributes].reduce((acc, { name, value }) => ({ [name]:value, ...acc }), {})

            if (blend)
                props.style = `mix-blend-mode:${blend}`

            this.layers.main.add(name, params, props)

        }

        element.graph = this

    }

    isVisible() {

        const { x, y, width, height } = this.wrapper.getBoundingClientRect()
        const rectWrapper = new Rectangle(x, y, width, height)
        const rectWindow = new Rectangle(0, 0, window.innerWidth, window.innerHeight)

        return rectWrapper.union(rectWindow).area > 0

    }

    draw() {

        for (let layer of Object.values(this.layers))
            layer.draw()

    }

}

for (let [name, method] of Object.entries(Draw)) {

    Graph.prototype[name] = function(...args) {

        return this.layers.main[name](...args)

    }

    Layer.prototype[name] = function(...args) {

        const { g } = this
        const { view, width, height } = this.graph
        Draw.setup(g, view, width, height)
        return method(...args)

    }

}



const parseDocument = (parentElement) => {

    if (!parentElement)
        parentElement = document.body

    document.head.append(style)

    for (let element of parentElement.querySelectorAll('graph')) {

        let graph = new Graph(element)
        element.insertAdjacentElement('beforeend', graph.wrapper)

    }

}



Object.assign(Graph, {

    parseDocument,
    Rectangle,
    Draw,

})

export default Graph
