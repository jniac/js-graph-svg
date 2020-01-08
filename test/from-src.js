import Graph from '../src/Graph.js'

Graph.parseDocument()

window.Graph = Graph
window.graph = document.querySelector('graph').graph

function loop(now) {

    const s = now / 1e3

    graph.layers.anim.clear()
    graph.layers.anim.func(x => .2 * Math.sin(x + s), { stroke:'#00f' })

    requestAnimationFrame(loop)

}

requestAnimationFrame(loop)
