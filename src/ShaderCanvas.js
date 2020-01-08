const vsSource = `
attribute vec3 pos;
attribute vec2 a_uv;
varying highp vec2 uv;
void main() {
    gl_Position = vec4(pos, 1.0);
    uv = a_uv;
}
`

const fsSource = `
precision highp float;
uniform float time;
varying highp vec2 uv;

float hole(vec2 center, float radius) {

    float d = clamp(length(center - uv) * 6. / radius -1., 0., 1.);
    d = smoothstep(0., 1., d);
    return d;

}

void main() {
    gl_FragColor = vec4(uv, 1, 1)
        * hole(vec2(.5, -.5 + mod(time, 2.)), 1.)
        * hole(vec2(.25, 1.5 - mod(time, 2.)), .3);
}
`

function getShaderProgram(gl, vs, fs) {

	let prog = gl.createProgram()

	let addshader = function(type, source) {

		let s = gl.createShader((type == 'vertex') ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER)
		gl.shaderSource(s, source)
		gl.compileShader(s)

		if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {

            throw new Error(`Could not compile ${type} shader:\n\n: ${gl.getShaderInfoLog(s)}`)
		}

		gl.attachShader(prog, s)

	}

	addshader('vertex', vs)
	addshader('fragment', fs)
	gl.linkProgram(prog)

	if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {

		throw new Error('Could not link the shader program!')

	}
	return prog
}

function attributeSetFloats(gl, prog, attrName, rsize, arr) {

	gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arr), gl.STATIC_DRAW)

    let attrLoc = gl.getAttribLocation(prog, attrName)
	gl.enableVertexAttribArray(attrLoc)
	gl.vertexAttribPointer(attrLoc, rsize, gl.FLOAT, false, 0, 0)

}

function draw(gl, prog, uv) {

	gl.clearColor(0, 0, 0, 0)
	gl.clear(gl.COLOR_BUFFER_BIT)

	gl.useProgram(prog);

	let timeloc = gl.getUniformLocation(prog, 'time')
	gl.uniform1f(timeloc, performance.now() / 1e3)

    attributeSetFloats(gl, prog, 'a_uv', 2, uv)

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

        const canvas = document.createElement('canvas')
        canvas.shaderCanvas = this

        Object.assign(this, { canvas })

        // let ctx = canvas.getContext('2d')
        // ctx.fillRect(0, 0, 200, 100)

        let gl = canvas.getContext('webgl2')

        if (!gl) {
            alert('Unable to initialize WebGL. Your browser or machine may not support it.');
            return;
        }

        const prog = getShaderProgram(gl, vsSource, fragmentShader)

        const loop = () => {

            const uv = [
                view.minX, view.minY,
                view.minX, view.maxY,
                view.maxX, view.minY,
                view.maxX, view.maxY,
            ]

            draw(gl, prog, uv)

            requestAnimationFrame(loop)

        }

        loop()

    }

}

export default ShaderCanvas
