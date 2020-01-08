
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

    union(other) {

        let x = Math.max(this.x, other.x)
        let y = Math.max(this.y, other.y)
        let maxX = Math.min(this.maxX, other.maxX)
        let maxY = Math.min(this.maxY, other.maxY)

        let width = maxX - x
        let height = maxY - y

        if (width < 0) {

            x = (x + maxX) / 2
            width = 0

        }

        if (height < 0) {

            y = (y + maxY) / 2
            height = 0

        }

        this.set(x, y, width, height)

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
