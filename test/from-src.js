import Graph from '../src/Graph.js'

Graph.parseDocument()

window.Graph = Graph


let time = 0

window.graph = document.querySelector('graph#time').graph

graph.layers.anim.add('func', [x => 1.5 * Math.sin(x * 2 + time * 1.5)],
    { stroke:'#fe3', 'stroke-width':80, style:'mix-blend-mode:multiply;' })

graph.layers.anim.add('func', [x => 1.2 * Math.sin(x + time)],
    { stroke:'#00f', 'stroke-width':6 })

graph.layers.anim.add('func', [x => 2.5 * Math.sin(x * .1 + time)],
    { stroke:'#f00' })

function loop(now) {

    time = now / 1e3

    if (graph.isVisible())
        graph.layers.anim.draw()

    requestAnimationFrame(loop)

}

requestAnimationFrame(loop)
