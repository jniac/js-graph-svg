import { dosvg, enumerate } from './helpers.js'
import ShaderCanvas from './ShaderCanvas.js'



const EPSILON = 1e-6
const notNull = x => x < -EPSILON || x > EPSILON
const ceil = (x, step = 1) => Math.ceil(x / step) * step
const enumerateCeil = (min, max, step) => enumerate({ min:ceil(min, step), max:ceil(max, step), step })



// context
let parent, view, width, height, current
let colors = ['black']



// initialize context
export const setup = (_parent, _view, _width, _height, _current) =>
    ([parent, view, width, height, current] = [_parent, _view, _width, _height, _current])


export const lineX = (x, props = {}) => {

    const { stroke = colors[0], ...rest } = props
    x = view.worldX(x) * width
    dosvg('line', { x1:x, x2:x, y1:0, y2:height, stroke, parent, ...rest })

}



export const lineY = (y, props = {}) => {

    const { stroke = colors[0], ...rest } = props
    y = (1 - view.worldY(y)) * height
    dosvg('line', { x1:0, x2:width, y1:y, y2:y, stroke, parent, ...rest })

}



export const grid = (_, props) => {

    parent = dosvg('g', { parent })
    parent.classList.add('grid')

    let {

        color = colors[0],
        step = 1,

    } = props

    parent.innerHTML = ''

    step = parseFloat(step)

    for (let x of enumerateCeil(view.x, view.maxX, step))
        lineX(x, { stroke:color, opacity:notNull(x) ? .1 : 1 })

    for (let y of enumerateCeil(view.y, view.maxY, step))
        lineY(y, { stroke:color, opacity:notNull(y) ? .1 : 1 })

    return parent

}



export const func = (f, props = {}) => {

    const getY = x => {

        let y = f(view.localX(x / width))
        return (1 - view.worldY(y)) * height

    }

    const pointString = (x, y, decimal = 1) => x.toFixed(decimal) + ',' + y.toFixed(decimal)

    const { stroke = colors[0], blend, ...rest } = props

    const margin = 1 + parseFloat(props['stroke-width'] || 0) / 2
    const min = -margin, max = width + margin
    const points = [...enumerate({ min, max, step:3, includeMax:true })]
        .map(x => pointString(x, getY(x)))
        .join(' ')

    return dosvg(current || 'polyline', { points, parent, stroke, fill:'none', ...rest })

}



export const point = (x, y, props = {}) => {

    const {

        color = colors[0],
        label = null,
        ...rest

    } = props

    const cx = view.worldY(x) * width
    const cy = (1 - view.worldY(y)) * height

    const circle = () => dosvg(current || 'circle', { cx, cy, r:4, parent, fill:color, stroke:'none', ...rest })

    if (label) {

        parent = dosvg('g', { parent })
        circle()
        dosvg('text', { x:cx + 5, y:cy,
            style: 'font-size: 8px;',
            children:label, parent, fill:color, stroke:'none' })

        return parent

    } else {

        return circle()

    }

}

export const shader = (fragmentShader) => {

    if (current)
        return current

    // NOTE: there is a bug with canvas & foreignObject, and no workaround
    // so foreignObject cannot be used in background...
    // current = dosvg('foreignObject', { parent, x:0, y:0, width, height })
    // current.append()

    const { canvas } = new ShaderCanvas(width, height, view, fragmentShader)

    const getDiv = element => {

        while(element && element.localName !== 'div')
            element = element.parentElement

        return element

    }

    const wrapper = getDiv(parent)
    wrapper.insertBefore(canvas, wrapper.firstChild)

    return current

}
