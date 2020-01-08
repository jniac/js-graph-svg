const svgNS = 'http://www.w3.org/2000/svg'
// const svgNS = 'http://www.w3.org/TR/SVG20/'

function* enumerate({ min = 0, max, step = 1, includeMax = false }) {

    while (min < max) {

        yield min
        min += step

    }

    if (includeMax)
        yield max

}

const dosvg = (element, { parent, children, ...props } = {}) => {

    if (typeof element === 'string')
        element = document.createElementNS(svgNS, element)

    for (let [key, value] of Object.entries(props)) {

        if (value !== undefined)
            element.setAttribute(key, value)

    }

    if (parent)
        parent.append(element)

    if (children)
        element.append(children)

    return element

}

const assignReadonly = (target, { enumerable = false, ...props }) => {

    for (let key in props)
        Object.defineProperty(target, key, { value:props[key] })

    return target

}

const removeLineHeadingSpaces = str => {

    const lines = str.split('\n')

    while (/\S/.test(lines[0]) === false)
        lines.shift()

    const [heading] = /^\s*/.exec(lines[0])

    return lines.map(line => line.replace(new RegExp(`^${heading}`), '')).join('\n')

}

export {

    dosvg,
    enumerate,
    assignReadonly,
    removeLineHeadingSpaces,

}
