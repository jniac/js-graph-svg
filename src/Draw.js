import { dosvg, enumerate } from './helpers.js'



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



export const grid = (step = 1) => {

    parent = dosvg('g', { parent })

    for (let x of enumerateCeil(view.x, view.maxX, step))
        lineX(x, { stroke:notNull(x) ? '#0001' : '#000' })

    for (let y of enumerateCeil(view.y, view.maxY, step))
        lineY(y, { stroke:notNull(y) ? '#0001' : '#000' })

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

        color = 'black',
        label = null,

    } = props

    const cx = view.worldY(x) * width
    const cy = (1 - view.worldY(y)) * height

    dosvg('circle', { cx, cy, r:4, parent, fill:color, stroke:'none' })

    if (label)
        dosvg('text', { x:cx + 5, y:cy,
            style: 'font-size: 8px;',
            children:label, parent, fill:color, stroke:'none' })

}
