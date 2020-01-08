const vsSource = `
    attribute vec4 aPos;
    attribute vec2 aUv;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying highp vec2 uv;

    void main(void) {
        gl_Position = uProjectionMatrix * uModelViewMatrix * aPos;
        uv = aUv;
    }
`

const fsSource = `
    varying highp vec2 uv;

    uniform sampler2D uSampler;

    void main(void) {
        gl_FragColor = vec4(uv, 1., 1.);
        // gl_FragColor = texture2D(uSampler, uv);
    }
`

class Canvas {

    constructor(graph) {

        this.graph = graph

        const canvas = document.createElement('canvas')
        graph.wrapper.append(canvas)

        Object.assign(this, { canvas })

    }

    setSize(width, height) {

        const { canvas } = this

        canvas.width = width
        canvas.height = height

        let gl = canvas.getContext('webgl2')

        if (!gl) {
            alert('Unable to initialize WebGL. Your browser or machine may not support it.');
            return;
        }

        // const shaderProgram = initShaderProgram(gl, vsSource, fsSource)

    }
}

export default Canvas
