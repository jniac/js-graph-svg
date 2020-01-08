const style = document.createElement('style')

style.innerHTML =
`
graph {
    display:inline-flex;
    flex-direction:column;
}

graph div.graph-wrapper {
    position: relative;
}

graph div.graph-wrapper svg,
graph div.graph-wrapper canvas {
    position: absolute;
    width: 100%;
    height: 100%;
}
`

export default style
