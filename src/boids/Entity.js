let idCounter = 0;

/**
 * @module Entity 
 * Entity class defines an entitiy model which has a position and a velocity.
 * Also it has some utiliy methods.
 */
export default class Entity {
    /**
     * Constructor for the Entity class
     * @param {Number} type entitiy type that defines it as flock or obstacle entitiy 
     * @param {Number} x x position
     * @param {Number} y y position
     * @param {Number} z z position
     * @param {Number} vx x velocity
     * @param {Number} vy y velocity
     * @param {Number} vz z velocity
     */
    constructor(type, x = 0, y = 0, z = 0, vx = 0, vy = 0, vz = 0, mesh = null) {
        this.id = ++idCounter;
        this.type = type;
        this.x = x;
        this.y = y;
        this.z = z;
        this.vx = vx;
        this.vy = vy;
        this.vz = vz;
        this.grid = undefined;
        this.mesh = undefined;
        this.mesh = mesh;

        this.stepCount = 0;

        this.gPull =
        {
            offset: Math.random() * 1000,
            delta: Math.random() * 4000 + 2000
        }



        this.FLOCK_ENTITY = 1;
        this.OBSTACLE_ENTITY = 1;
    }

    /**
     * Sets the grid instance
     * @param {Grid} grid 
     */
    setGrid(grid) {
        this.grid = grid;
    }

    /**
     * @returns {Number} type of the entity
     */
    getType() {
        return this.type;
    }

    /**
     * @returns {Number} the current scalar velocity of the entity.
     */
    getVelocity() {
        return Math.sqrt((this.vx * this.vx) + (this.vy * this.vy) + (this.vz * this.vz));
    }

    /**
     * Checks the velocity of the entitiy and limits it to the given parameter
     * @param {Number} maxVelocity 
     */
    checkVelocity(maxVelocity = 1) {
        const velocity = this.getVelocity();

        if (velocity > maxVelocity && velocity > 0) {
            this.vx = maxVelocity * this.vx / velocity;
            this.vy = maxVelocity * this.vy / velocity;
            this.vz = maxVelocity * this.vz / velocity;
        }
    }

    /**
     * This method adds the given velocity to the current velocity.
     * @param {Number} vx x velocity
     * @param {Number} vy y velocity
     * @param {Number} vz z velocity
     */
    addVelocity(vx, vy, vz) {
        this.vx += vx;
        this.vy += vy;
        this.vz += vz;
    }

    /**
     * This method moves the entity.
     * @param {Number} maxVelocity 
     * @param {Number} bx 
     * @param {Number} by 
     * @param {Number} bz 
     */

    calculateDistance(p1, p2) {
        var a = p2.x - p1.x;
        var b = p2.y - p1.y;
        var c = p2.z - p1.z;

        return Math.hypot(a, b, c);
    }

    getDirToCenter(p1, p2) {
        let dir = { x: p1.x - p2.x, y: p1.y - p2.y, z: p1.z - p2.z };
        let dist = Math.hypot(dir.x, dir.y, dir.z);
        let normDir = { x: dir.x / dist, y: dir.y / dist, z: dir.z / dist };
        return normDir;
    }

    getClosestPoint(p1, p2, radius, distance) {
        let dir = { x: p1.x - p2.x, y: p1.y - p2.y, z: p1.z - p2.z };
        let normDir = { x: dir.x / distance, y: dir.y / distance, z: dir.z / distance };
        let closestPoint = {
            x: p2.x + normDir.x * radius,
            y: p2.y + normDir.y * radius,
            z: p2.z + normDir.z * radius,

        }
        return closestPoint;
    }
    move(maxVelocity, bx, by, bz, gravity) {
        this.checkVelocity(maxVelocity);
        let nPos = {
            x: this.x + this.vx,
            y: this.y + this.vy,
            z: this.z + this.vz
        }

        let radius = bx;
        let root = { x: bx / 2, y: bx / 2, z: bx / 2 };

        let distance = this.calculateDistance(nPos, root);
        let weight = (distance) / (radius);
        weight = Math.max(0, weight);
        let iWeight = weight == 0 ? 1 : (1 - weight);

        // gravity

        let normDir = this.getDirToCenter(nPos, root);
        let now = new Date().getTime() / this.gPull.delta;
        let wave = (Math.sin(now + this.gPull.offset) / 3 + 4 / 3)  /* + (Math.abs(Math.sin(now / Math.PI)) * 2) */;
        let gWeight = (Math.exp(weight)) * (1 / 2 + weight / 2) * -1 * wave * gravity;
        if (!normDir.x || !gWeight) {
            console.log("err");
            console.log(normDir.x, gWeight);
        }
        nPos = {
            x: nPos.x + normDir.x * gWeight,
            y: nPos.y + normDir.y * gWeight,
            z: nPos.z + normDir.z * gWeight,
        }

        this.grid.moveEntity(this, nPos.x, nPos.y, nPos.z);
        this.stepCount++;
    }

    /**
     * Calculate the distance between the entity and the given entity
     * @param {Entity} otherEntity 
     * @returns {Number} the distance between two entities
     */
    getDistance(otherEntity) {
        const dx = this.x - otherEntity.x;
        const dy = this.y - otherEntity.y;
        const dz = this.z - otherEntity.z;
        return Math.sqrt((dx * dx) + (dy * dy) + (dz * dz));
    }

    /**
     * Serialized the entitiy
     * @returns {Object} serialized data
     */
    serialize() {
        const { id, type, x, y, z, vx, vy, vz } = this;
        return {
            id, type, x, y, z, vx, vy, vz
        }
    }

    /**
     * Updates the internal data of the entity if the IDs match
     * @param {Object} data 
     */
    updateData(data) {
        if (this.id == data.id) {
            this.vx = data.vx;
            this.vy = data.vy;
            this.vz = data.vz;
            this.grid.moveEntity(this, data.x, data.y, data.z);
        }
    }

    /**
     * This static method deserializes the given data and returns new Entity instance.
     * @param {Object} data 
     * @returns {Entitiy} deserialized Entitiy instance
     */
    static deserialize(data) {
        const e = new Entity(data.type, data.x, data.y, data.z, data.vx, data.vy, data.vz, data.avatar);
        e.id = data.id;
        return e;
    }
}