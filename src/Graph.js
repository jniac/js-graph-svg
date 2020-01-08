import Rectangle from './Rectangle.js'
import Layer from './Layer.js'
import Canvas from './Canvas.js'
import style from './style.js'
import * as Draw from './Draw.js'
import { dosvg, enumerate } from './helpers.js'

class Graph {

    constructor(element) {

        const wrapper = document.createElement('div')
        wrapper.classList.add('graph-wrapper')

        const width = 400, height = 400
        const svg = dosvg('svg', { width, height, parent:wrapper })
        const view = new Rectangle(-4, -4, 8, 8)
        const layers = Layer.getLayersProxy(this)

        const bounds = dosvg('rect', { parent:svg, fill:'none', stroke:'black' })

        Object.assign(this, { wrapper, svg, bounds, view, layers })

        this.canvas = new Canvas(this)

        this.setSize(width, height)

        if (element)
            this.init(element)

    }

    setSize(width, height) {

        const { wrapper, svg, bounds, view, canvas } = this

        Object.assign(this, { width, height })
        dosvg(svg, { width, height })
        dosvg(bounds, { x:.5, y:.5, width:width - 1, height:height - 1 })

        wrapper.style.width = `${width}px`
        wrapper.style.height = `${height}px`

        let { grid } = this.layers
        let step = 1

        grid.clear()
        grid.grid(step)

        canvas.setSize(width, height)

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

        for (let child of element.children) {

            const { localName:name } = child
            const params = new Function(`return [${child.innerText}]`)()

            const { blend, ...props } = [...child.attributes].reduce((acc, { name, value }) => ({ [name]:value, ...acc }), {})

            if (blend)
                props.style = `mix-blend-mode:${blend}`

            this.layers.main[name](...params, props)

        }

        element.graph = this

    }

}

for (let [name, method] of Object.entries(Draw)) {

    Graph.prototype[name] = function(...args) {

        this.layers.main[name](...args)

    }

    Layer.prototype[name] = function(...args) {

        const { g } = this
        const { view, width, height } = this.graph
        Draw.setup(g, view, width, height)
        method(...args)

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
