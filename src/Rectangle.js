
export default class Rectangle {

    constructor(x, y, width, height) {

        this.set(x, y, width, height)

    }

    set(x, y, width, height) {

        Object.assign(this, { x, y, width, height })

    }

    offset(x, y) {

        this.x += x
        this.y += y

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
