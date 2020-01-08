/*
	graph-svg.js
	2020-01-08 10:43 GMT(+1)
	js toolkit
	https://github.com/jniac/js-graph-svg
*/

class Rectangle {

    constructor(x, y, width, height) {

        this.set(x, y, width, height);

    }

    set(x, y, width, height) {

        Object.assign(this, { x, y, width, height });

    }

    offset(x, y) {

        this.x += x;
        this.y += y;

    }

    get maxX() { return this.x + this.width }
    get maxY() { return this.y + this.height }

    containsX(x) { return x >= this.x && x <= this.maxX }
    containsY(y) { return y >= this.y && y <= this.maxY }
    localX(x) { return this.x + this.width * x }
    localY(y) { return this.y + this.height * y }
    worldX(x) { return (x - this.x) / this.width }
    worldY(y) { return (y - this.y) / this.height }

}

const svgNS = 'http://www.w3.org/2000/svg';

function* enumerate({ min = 0, max, step = 1, includeMax = false }) {

    while (min < max) {

        yield min;
        min += step;

    }

    if (includeMax)
        yield max;

}

const dosvg = (element, { parent, children, ...props } = {}) => {

    if (typeof element === 'string')
        element = document.createElementNS(svgNS, element);

    for (let [key, value] of Object.entries(props)) {

        if (value !== undefined)
            element.setAttribute(key, value);

    }

    if (parent)
        parent.append(element);

    if (children)
        element.append(children);

    return element

};

const assignReadonly = (target, { enumerable = false, ...props }) => {

    for (let key in props)
        Object.defineProperty(target, key, { value:props[key] });

    return target

};

const getLayersProxy = (graph) => new Proxy({}, {

    get: (target, key) => {

        if (key in target)
            return target[key]

        return target[key] = new Layer(graph, key)

    },

});

class Layer {

    constructor(graph, name) {

        this.graph = graph;
        this.g = dosvg('g', { id:name });
        this.objects = [];

        graph.svg.insertBefore(this.g, graph.bounds);

    }

    clear() {

        this.g.innerHTML = '';

    }

    draw() {

        this.clear();

        for (const [name, params, props] of this.objects) {

            this[name](...params, props);

        }

    }

    add(name, params, props) {

        this.objects.push([name, params, props]);

    }

}

assignReadonly(Layer, { getLayersProxy });

class Canvas {

    constructor(graph) {

        this.graph = graph;

        const canvas = document.createElement('canvas');
        graph.wrapper.append(canvas);

        Object.assign(this, { canvas });

    }

    setSize(width, height) {

        const { canvas } = this;

        canvas.width = width;
        canvas.height = height;

        let gl = canvas.getContext('webgl2');

        if (!gl) {
            alert('Unable to initialize WebGL. Your browser or machine may not support it.');
            return;
        }

        // const shaderProgram = initShaderProgram(gl, vsSource, fsSource)

    }
}

class Point {

    constructor(x = 0, y = 0) {

        this.set(x, y);

    }

    get components() { return [this.x, this.y] }

    set(x, y) {

        this.x = x;
        this.y = y;

    }

    copy(other) {

        this.x = other.x;
        this.y = other.y;

    }

    subVectors(a, b) {

        this.x = a.x - b.x;
        this.y = a.y - b.y;

    }

}

function onMove(event) {

    const { view, width, height } = this.graph;
    const { clientX, clientY } = event;

    const bounding = this.graph.wrapper.getBoundingClientRect();
    const x = clientX - bounding.x;
    const y = clientY - bounding.y;

    // if first move, initialize this
    if (!this.hasMoved) {

        this.set(x, y);
        this.hasMoved = true;

    }

    const { old, delta } = this;
    old.copy(this);
    this.set(x, y);
    delta.subVectors(this, old);

    if (this.down) {

        const dx = -delta.x / width * view.width;
        const dy = delta.y / height * view.height;
        view.offset(dx, dy);
        this.graph.draw();

    }

    this.graph.wrapper.dispatchEvent(new CustomEvent('move'));

}

function onDown(event) {

    this.down = true;

    window.addEventListener('mouseup', this.onUp);
    this.graph.wrapper.dispatchEvent(new CustomEvent('down'));

}

function onUp(event) {

    this.down = false;

    window.removeEventListener('mouseup', this.onUp);
    this.graph.wrapper.dispatchEvent(new CustomEvent('up'));

}

class Pointer extends Point {

    constructor(graph) {

        super();
        this.graph = graph;
        this.old = new Point();
        this.delta = new Point();

        this.onMove = onMove.bind(this);
        this.onDown = onDown.bind(this);
        this.onUp = onUp.bind(this);

        graph.wrapper.addEventListener('mousemove', this.onMove);
        graph.wrapper.addEventListener('mousedown', this.onDown);

    }

}

const style = document.createElement('style');

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
`;

const EPSILON = 1e-6;
const notNull = x => x < -EPSILON || x > EPSILON;
const ceil = (x, step = 1) => Math.ceil(x / step) * step;
const enumerateCeil = (min, max, step) => enumerate({ min:ceil(min, step), max:ceil(max, step), step });



// context
let parent, view, width, height, colors = ['black'];



// initialize context
const setup = (_parent, _view, _width, _height) =>
    ([parent, view, width, height] = [_parent, _view, _width, _height]);


const lineX = (x, props = {}) => {

    const { stroke = colors[0], ...rest } = props;
    x = view.worldX(x) * width;
    dosvg('line', { x1:x, x2:x, y1:0, y2:height, stroke, parent, ...rest });

};



const lineY = (y, props = {}) => {

    const { stroke = colors[0], ...rest } = props;
    y = (1 - view.worldY(y)) * height;
    dosvg('line', { x1:0, x2:width, y1:y, y2:y, stroke, parent, ...rest });

};



const grid = (step = 1) => {

    for (let x of enumerateCeil(view.x, view.maxX, step))
        lineX(x, { stroke:notNull(x) ? '#0001' : '#000' });

    for (let y of enumerateCeil(view.y, view.maxY, step))
        lineY(y, { stroke:notNull(y) ? '#0001' : '#000' });

};



const func = (f, props = {}) => {

    const getY = x => {

        let y = f(view.localX(x / width));
        return (1 - view.worldY(y)) * height

    };

    const pointString = (x, y, decimal = 1) => x.toFixed(decimal) + ',' + y.toFixed(decimal);

    const { stroke = colors[0], blend, ...rest } = props;

    const margin = 1 + parseFloat(props['stroke-width'] || 0) / 2;
    const min = -margin, max = width + margin;
    const points = [...enumerate({ min, max, step:3, includeMax:true })]
        .map(x => pointString(x, getY(x)))
        .join(' ');

    return dosvg('polyline', { points, parent, stroke, fill:'none', ...rest })

};



const point = (x, y, props = {}) => {

    const {

        color = 'black',
        label = null,

    } = props;

    const cx = view.worldY(x) * width;
    const cy = (1 - view.worldY(y)) * height;

    dosvg('circle', { cx, cy, r:4, parent, fill:color, stroke:'none' });

    if (label)
        dosvg('text', { x:cx + 5, y:cy,
            style: 'font-size: 8px;',
            children:label, parent, fill:color, stroke:'none' });

};

var Draw = /*#__PURE__*/Object.freeze({
	setup: setup,
	lineX: lineX,
	lineY: lineY,
	grid: grid,
	func: func,
	point: point
});

class Graph {

    constructor(element) {

        const wrapper = document.createElement('div');
        wrapper.classList.add('graph-wrapper');

        const width = 400, height = 400;
        const svg = dosvg('svg', { width, height, parent:wrapper });
        const view = new Rectangle(-4, -4, 8, 8);

        Object.assign(this, { wrapper, svg, view });

        const bounds = dosvg('rect', { parent:svg, fill:'none', stroke:'black' });
        const layers = Layer.getLayersProxy(this);
        const pointer = new Pointer(this);
        const canvas = new Canvas(this);

        Object.assign(this, { bounds, layers, pointer, canvas });

        this.setSize(width, height);

        if (element)
            this.init(element);

        wrapper.addEventListener('mousemove', (e) => {

            let { offsetX:mouseX, offsetY:mouseY } = e;
            mouseX /= width;
            mouseY /= height;
            mouseX = view.localX(mouseX);
            mouseY = view.localX(1 - mouseY);
            Object.assign(this, { mouseX, mouseY });

            svg.dispatchEvent(new CustomEvent('move'));

        });

    }

    setSize(width, height) {

        const { wrapper, svg, bounds, view, canvas } = this;

        Object.assign(this, { width, height });
        dosvg(svg, { width, height });
        dosvg(bounds, { x:.5, y:.5, width:width - 1, height:height - 1 });

        wrapper.style.width = `${width}px`;
        wrapper.style.height = `${height}px`;

        canvas.setSize(width, height);

        this.draw();

    }

    init(element) {

        if (element.hasAttribute('view')) {

            const rect = element.getAttribute('view').split(',').map(i => parseFloat(i));
            this.view.set(...rect);

        }

        if (element.hasAttribute('size')) {

            const [width, height] = element.getAttribute('size').split(',').map(i => parseInt(i));
            this.setSize(width, height);

        }

        for (let child of element.children) {

            const { localName:name } = child;
            const params = new Function(`return [${child.innerText}]`)();

            const { blend, ...props } = [...child.attributes].reduce((acc, { name, value }) => ({ [name]:value, ...acc }), {});

            if (blend)
                props.style = `mix-blend-mode:${blend}`;

            this.layers.main.add(name, params, props);

        }

        element.graph = this;

        this.draw();

    }

    draw() {

        let { grid: grid$$1, ...others } = this.layers;
        let step = 1;

        grid$$1.clear();
        grid$$1.grid(step);

        for (let layer of Object.values(others))
            layer.draw();

    }

}

for (let [name, method] of Object.entries(Draw)) {

    Graph.prototype[name] = function(...args) {

        this.layers.main[name](...args);

    };

    Layer.prototype[name] = function(...args) {

        const { g } = this;
        const { view, width, height } = this.graph;
        setup(g, view, width, height);
        method(...args);

    };

}



const parseDocument = (parentElement) => {

    if (!parentElement)
        parentElement = document.body;

    document.head.append(style);

    for (let element of parentElement.querySelectorAll('graph')) {

        let graph = new Graph(element);
        element.insertAdjacentElement('beforeend', graph.wrapper);

    }

};



Object.assign(Graph, {

    parseDocument,
    Rectangle,
    Draw,

});

export default Graph;
