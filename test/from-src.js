import Graph from '../src/Graph.js'

Graph.parseDocument()

window.Graph = Graph


let time = 0

window.graphTime = document.querySelector('graph#time').graph

graphTime.layers.anim.add('func', [x => 1.5 * Math.sin(x * 2 + time * 1.5)],
    { stroke:'#fe3', 'stroke-width':80, style:'mix-blend-mode:multiply;' })

graphTime.layers.anim.add('func', [x => 1.2 * Math.sin(x + time)],
    { stroke:'#00f', 'stroke-width':6 })

graphTime.layers.anim.add('func', [x => 2.5 * Math.sin(x * .1 + time)],
    { stroke:'#f00' })


window.graphMix = document.querySelector('graph#mix').graph
graphMix.layers.anim.add('func', [x => Math.sin(x * .1 + time)],
    { stroke:'#f00' })
graphMix.layers.anim.add('func', [x => Math.sin(x * .5 + time + 1)],
    { stroke:'#fe3', 'stroke-width':16 })

function loop(now) {

    time = now / 1e3

    if (graphTime.isVisible())
        graphTime.layers.anim.draw()

    if (graphMix.isVisible())
        graphMix.layers.anim.draw()

    requestAnimationFrame(loop)

}

requestAnimationFrame(loop)
