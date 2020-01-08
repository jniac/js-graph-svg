/*
	graph-svg.js
	2020-01-08 14:47 GMT(+1)
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

    union(other) {

        let x = Math.max(this.x, other.x);
        let y = Math.max(this.y, other.y);
        let maxX = Math.min(this.maxX, other.maxX);
        let maxY = Math.min(this.maxY, other.maxY);

        let width = maxX - x;
        let height = maxY - y;

        if (width < 0) {

            x = (x + maxX) / 2;
            width = 0;

        }

        if (height < 0) {

            y = (y + maxY) / 2;
            height = 0;

        }

        this.set(x, y, width, height);

        return this

    }

    get area() { return this.width * this.height }

    // handy
    get minX() { return this.x }
    get minY() { return this.y }
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
// const svgNS = 'http://www.w3.org/TR/SVG20/'

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

const removeLineHeadingSpaces = str => {

    const lines = str.split('\n');

    while (/\S/.test(lines[0]) === false)
        lines.shift();

    const [heading] = /^\s*/.exec(lines[0]);

    return lines.map(line => line.replace(new RegExp(`^${heading}`), '')).join('\n')

};

const vsSource = `
attribute vec3 pos;
attribute vec2 a_uv;
varying highp vec2 uv;
void main() {
    gl_Position = vec4(pos, 1.0);
    uv = a_uv;
}
`;

function getShaderProgram(gl, vs, fs) {

	let prog = gl.createProgram();

	let addshader = function(type, source) {

		let s = gl.createShader((type == 'vertex') ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER);
		gl.shaderSource(s, source);
		gl.compileShader(s);

		if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {

            throw new Error(`Could not compile ${type} shader:\n\n: ${gl.getShaderInfoLog(s)}`)
		}

		gl.attachShader(prog, s);

	};

	addshader('vertex', vs);
	addshader('fragment', fs);
	gl.linkProgram(prog);

	if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {

		throw new Error('Could not link the shader program!')

	}
	return prog
}

function attributeSetFloats(gl, prog, attrName, rsize, arr) {

	gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arr), gl.STATIC_DRAW);

    let attrLoc = gl.getAttribLocation(prog, attrName);
	gl.enableVertexAttribArray(attrLoc);
	gl.vertexAttribPointer(attrLoc, rsize, gl.FLOAT, false, 0, 0);

}

function draw(gl, prog, uv) {

	gl.clearColor(0, 0, 0, 0);
	gl.clear(gl.COLOR_BUFFER_BIT);

	gl.useProgram(prog);

	let timeloc = gl.getUniformLocation(prog, 'time');
	gl.uniform1f(timeloc, performance.now() / 1e3);

    attributeSetFloats(gl, prog, 'a_uv', 2, uv);

	attributeSetFloats(gl, prog, "pos", 3, [
		-1, -1, 0,
		-1, 1, 0,
		1, -1, 0,
		1, 1, 0
	]);

	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}



class ShaderCanvas {

    constructor(width, height, view, fragmentShader) {

        const canvas = document.createElement('canvas');
        canvas.shaderCanvas = this;

        Object.assign(this, { canvas });

        // let ctx = canvas.getContext('2d')
        // ctx.fillRect(0, 0, 200, 100)

        let gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

        if (!gl) {
            alert('Unable to initialize WebGL. Your browser or machine may not support it.');
            return;
        }

        const prog = getShaderProgram(gl, vsSource, fragmentShader);

        const loop = () => {

            const uv = [
                view.minX, view.minY,
                view.minX, view.maxY,
                view.maxX, view.minY,
                view.maxX, view.maxY,
            ];

            draw(gl, prog, uv);

            requestAnimationFrame(loop);

        };

        loop();

    }

}

const EPSILON = 1e-6;
const notNull = x => x < -EPSILON || x > EPSILON;
const ceil = (x, step = 1) => Math.ceil(x / step) * step;
const enumerateCeil = (min, max, step) => enumerate({ min:ceil(min, step), max:ceil(max, step), step });



// context
let parent, view, width, height, current;
let colors = ['black'];



// initialize context
const setup = (_parent, _view, _width, _height, _current) =>
    ([parent, view, width, height, current] = [_parent, _view, _width, _height, _current]);


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



const grid = (_, props) => {

    parent = dosvg('g', { parent });
    parent.classList.add('grid');

    let {

        color = colors[0],
        step = 1,

    } = props;

    parent.innerHTML = '';

    step = parseFloat(step);

    for (let x of enumerateCeil(view.x, view.maxX, step))
        lineX(x, { stroke:color, opacity:notNull(x) ? .1 : 1 });

    for (let y of enumerateCeil(view.y, view.maxY, step))
        lineY(y, { stroke:color, opacity:notNull(y) ? .1 : 1 });

    return parent

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

    return dosvg(current || 'polyline', { points, parent, stroke, fill:'none', ...rest })

};



const point = (x, y, props = {}) => {

    const {

        color = colors[0],
        label = null,
        ...rest

    } = props;

    const cx = view.worldY(x) * width;
    const cy = (1 - view.worldY(y)) * height;

    const circle = () => dosvg(current || 'circle', { cx, cy, r:4, parent, fill:color, stroke:'none', ...rest });

    if (label) {

        parent = dosvg('g', { parent });
        circle();
        dosvg('text', { x:cx + 5, y:cy,
            style: 'font-size: 8px;',
            children:label, parent, fill:color, stroke:'none' });

        return parent

    } else {

        return circle()

    }

};

const shader = (fragmentShader) => {

    if (current)
        return current

    // NOTE: there is a bug with canvas & foreignObject, and no workaround
    // so foreignObject cannot be used in background...
    // current = dosvg('foreignObject', { parent, x:0, y:0, width, height })
    // current.append()

    const shaderCanvas = new ShaderCanvas(width, height, view, fragmentShader);
    const { canvas } = shaderCanvas;

    const getDiv = element => {

        while(element && element.localName !== 'div')
            element = element.parentElement;

        return element

    };

    const wrapper = getDiv(parent);
    wrapper.insertBefore(canvas, wrapper.firstChild);

    return shaderCanvas

};

var Draw = /*#__PURE__*/Object.freeze({
	setup: setup,
	lineX: lineX,
	lineY: lineY,
	grid: grid,
	func: func,
	point: point,
	shader: shader
});

const getLayersProxy = (graph) => new Proxy({}, {

    get: (target, key) => {

        if (key in target)
            return target[key]

        return target[key] = new Layer(graph, key)

    },

});

const safeDraw = (key, params, props) => {

    if (!(key in Draw)) {

        console.warn(`Layer cannot draw [${key}]`);
        return

    }

    return Draw[key](...params, props)

};

class Layer {

    constructor(graph, name) {

        this.graph = graph;
        this.g = dosvg('g', { id:name });
        this.objects = [];
        this.name = name;

        graph.svg.insertBefore(this.g, graph.bounds);

    }

    clear() {

        this.g.innerHTML = '';

    }

    draw() {

        this.clear();

        const { g } = this;
        const { view, width, height } = this.graph;

        for (const bundle of this.objects) {

            const [key, params, props, current] = bundle;

            // Draw and save element
            setup(g, view, width, height, current);
            bundle[3] = safeDraw(key, params, props);

        }

    }

    add(key, params, props) {

        const { g } = this;
        const { view, width, height } = this.graph;
        setup(g, view, width, height, null);

        const bundle = [key, params, props, null];
        bundle[3] = safeDraw(key, params, props);

        this.objects.push(bundle);

    }

}

assignReadonly(Layer, { getLayersProxy });

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

        Object.assign(this, { bounds, layers, pointer });

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

        for (const canvas of wrapper.querySelectorAll('canvas'))
            canvas.shaderCanvas.setSize(width, height);

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
            const text = removeLineHeadingSpaces(child.innerText);
            child.innerText = text;

            const params = /func|point/.test(name)
                ? new Function(`return [${text}]`)()
                : [text];

            const { blend, ...props } = [...child.attributes].reduce((acc, { name, value }) => ({ [name]:value, ...acc }), {});

            if (blend)
                props.style = `mix-blend-mode:${blend}`;

            this.layers.main.add(name, params, props);

        }

        element.graph = this;

    }

    isVisible() {

        const { x, y, width, height } = this.wrapper.getBoundingClientRect();
        const rectWrapper = new Rectangle(x, y, width, height);
        const rectWindow = new Rectangle(0, 0, window.innerWidth, window.innerHeight);

        return rectWrapper.union(rectWindow).area > 0

    }

    draw() {

        for (let layer of Object.values(this.layers))
            layer.draw();

    }

}

for (let [name, method] of Object.entries(Draw)) {

    Graph.prototype[name] = function(...args) {

        return this.layers.main[name](...args)

    };

    Layer.prototype[name] = function(...args) {

        const { g } = this;
        const { view, width, height } = this.graph;
        setup(g, view, width, height);
        return method(...args)

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
