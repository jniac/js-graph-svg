import { dosvg, assignReadonly } from './helpers.js'

const getLayersProxy = (graph) => new Proxy({}, {

    get: (target, key) => {

        if (key in target)
            return target[key]

        return target[key] = new Layer(graph, key)

    },

})

class Layer {

    constructor(graph, name) {

        this.graph = graph
        this.g = dosvg('g', { id:name })
        this.objects = []

        graph.svg.insertBefore(this.g, graph.bounds)

    }

    clear() {

        this.g.innerHTML = ''

    }

    draw() {

        this.clear()

        for (const [name, params, props] of this.objects) {

            this[name](...params, props)

        }

    }

    add(name, params, props) {

        this.objects.push([name, params, props])

    }

}

assignReadonly(Layer, { getLayersProxy })

export default Layer
