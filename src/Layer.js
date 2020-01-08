import * as Draw from './Draw.js'
import { dosvg, assignReadonly } from './helpers.js'

const getLayersProxy = (graph) => new Proxy({}, {

    get: (target, key) => {

        if (key in target)
            return target[key]

        return target[key] = new Layer(graph, key)

    },

})

const safeDraw = (key, params, props) => {

    if (!(key in Draw)) {

        console.warn(`Layer cannot draw [${key}]`)
        return

    }

    return Draw[key](...params, props)

}

class Layer {

    constructor(graph, name) {

        this.graph = graph
        this.g = dosvg('g', { id:name })
        this.objects = []
        this.name = name

        graph.svg.insertBefore(this.g, graph.bounds)

    }

    clear() {

        this.g.innerHTML = ''

    }

    draw() {

        this.clear()

        const { g } = this
        const { view, width, height } = this.graph

        for (const bundle of this.objects) {

            const [key, params, props, current] = bundle

            // Draw and save element
            Draw.setup(g, view, width, height, current)
            bundle[3] = safeDraw(key, params, props)

        }

    }

    add(key, params, props) {

        const { g } = this
        const { view, width, height } = this.graph
        Draw.setup(g, view, width, height, null)

        const bundle = [key, params, props, null]
        bundle[3] = safeDraw(key, params, props)

        this.objects.push(bundle)

    }

}

assignReadonly(Layer, { getLayersProxy })

export default Layer
