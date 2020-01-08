
export default class Point {

    constructor(x = 0, y = 0) {

        this.set(x, y)

    }

    get components() { return [this.x, this.y] }

    set(x, y) {

        this.x = x
        this.y = y

    }

    copy(other) {

        this.x = other.x
        this.y = other.y

    }

    subVectors(a, b) {

        this.x = a.x - b.x
        this.y = a.y - b.y

    }

}
