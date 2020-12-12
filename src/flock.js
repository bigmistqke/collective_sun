//-----------------
// Global Variables
//-----------------
import * as THREE from "three";
import { FlyControls } from "./three/FlyControls.js";


// Convenience variables
var W = window.innerWidth;
var H = window.innerHeight;

const clock = new THREE.Clock();

// Color list
var col = {
    red: 0xCC2200,
    blue: 0x333399,
    black: 0x222222,
    grey: 0x111133,
    white: 0xCCCCAA,
    green: 0x00FF00,
    void: 0x111111
};

let s = {
    separation: 0.02,
    alignment: 0.05,
    cohesion: 0.001,
    centering: 0.0001,
    mass: 0.1,
    amount: 500
};

// Geometry types
var geom = {
    box: new THREE.BoxGeometry(1, 1, 1),
    ico: new THREE.IcosahedronGeometry(1, 0),
    tri: new THREE.CylinderGeometry(1, 1, 1, 3),
    taper: new THREE.CylinderGeometry(0.5, 1, 1, 4),
    sphere: new THREE.SphereGeometry(2.5)
};

// Materials
var mat = {
    default: new THREE.MeshBasicMaterial({ color: col.white }),
    x_hull: new THREE.MeshBasicMaterial({ color: col.white }),
    o_hull: new THREE.MeshBasicMaterial({ color: col.grey, shading: THREE.FlatShading }),
    x_dec: new THREE.MeshBasicMaterial({ color: col.red }),
    o_dec: new THREE.MeshBasicMaterial({ color: col.blue }),
    x_pit: new THREE.MeshBasicMaterial({ color: col.black }),
    o_pit: new THREE.MeshBasicMaterial({ color: col.green })
};

// Global objects
var controls;
var boids = [];

let g = {};

g.loader = new THREE.TextureLoader();


//----------------
// Create Objects
//----------------


//-----------------
// Setup Functions
//-----------------

function changeBall() {
    boids[Math.floor(Math.random() * boids.length)].obj.mesh.add(g.camera);
}

document.body.addEventListener("keydown", (e) => {
    console.log(e.code);
    if (e.code === "Space") {
        changeBall();
    }
})

const initSun = () => {
    let sunTexture;
    let count = 0;
    let xAmount = 3;
    let yAmount = 2;

    function spriteAnimate() {
        let xOffs = count % xAmount / xAmount;
        let yOffs = Math.floor(count / xAmount) % yAmount / yAmount;
        sunTexture.offset.set(xOffs, yOffs);
        count++;
        setTimeout(spriteAnimate, 250);
    }

    g.loader.load(
        "./sun/sprite.png",
        function (texture) {
            console.log("SUUUUUUUUUN");
            sunTexture = texture;
            const material = new THREE.MeshBasicMaterial({
                map: sunTexture,
                side: THREE.DoubleSide
            });
            sunTexture.repeat.set(0.33333, 0.5);

            let sphere = new THREE.Mesh(geom.sphere, material);

            g.sun = sphere;
            g.sun.scale.set(1000, 1000, 1000);
            g.scene.add(sphere);
            spriteAnimate();
            // resolve(sphere);
        },
        undefined,
        function (err) {
            console.error('An error happened.');
        }
    );



}

function initRender() {

    g.scene = new THREE.Scene();

    g.camera = new THREE.PerspectiveCamera(90, W / H, 0.1, 10000);
    g.camera.position.set(0, 0, 50);
    // g.camera.lookAt(g.scene.position);

    let sun = new THREE.Mesh(geom.sphere, mat)


    g.renderer = new THREE.WebGLRenderer();
    g.renderer.setSize(W, H);
    g.renderer.setClearColor(col.void);

    document.body.appendChild(g.renderer.domElement);

    window.addEventListener('resize', onWindowResize, false);
};

function onWindowResize() {
    g.camera.aspect = W / H;
    g.camera.updateProjectionMatrix();
    g.renderer.setSize(W, H);
}

function initLights() {
    var light_amb = new THREE.AmbientLight(0x999999, 1);

    var light_hem = new THREE.HemisphereLight(0xFFFFCC, 0x222200, 1);
    light_hem.position.setY(15);

    var light_dir = new THREE.DirectionalLight();

    g.scene.add(light_amb, light_hem, light_dir);
};

function initFlock() {
    // Popoulate X-Boid ships
    var i = 0;
    while (i < s.amount) {
        boids[i] = new Boid(1);
        i++;
    }
    changeBall();
}

function Ball() {
    let mesh = new THREE.Mesh(geom.sphere, mat.default);
    this.mesh = mesh;
};

function OShip() {
    let mesh = new THREE.Mesh(geom.sphere, mat.default);
    this.mesh = mesh;
};

//-------------------------------------------------------
// Flocking Implementation - adapted from lecture example
//-------------------------------------------------------

// Helper function; shortcut for random number in certain range
function rrand(min, max) {
    return Math.random() * (max - min) + min;
};

function rrange(range) {
    return Math.random() * range - range * 0.5;
}

function rvec3(range) {

    return new THREE.Vector3(rrange(range), rrange(range), rrange(range));
};

// Boid Definition
function Boid() {
    // Initial movement vectors
    let rad = 250;

    this.position = rvec3(rad);
    // this.position = new THREE.Vector3(getRandom(), getRandom(), getRandom());

    this.velocity = new THREE.Vector3(rrand(-1, 1), rrand(-1, 1), rrand(-1, 1));
    this.acceleration = new THREE.Vector3(0, 0, 0);
    this.mass = s.mass;
    // Type determines boid geometry, home location, and starting position
    this.obj = new Ball();
    this.home = new THREE.Vector3(-50, 0, 0);
    g.scene.add(this.obj.mesh);

};

// Run an iteration of the flock
Boid.prototype.step = function (flock, reCalc) {
    if (reCalc) {
        this.accumulate(flock);
    }
    this.update(reCalc);
    this.obj.mesh.position.set(this.position.x, this.position.y, this.position.z);
};



// Apply Forces
Boid.prototype.accumulate = function (flock) {
    var separation, alignment, cohesion, centering;
    separation = this.separate(flock).multiplyScalar(s.separation * this.mass);
    alignment = this.align(flock).multiplyScalar(s.alignment);
    cohesion = this.cohesion(flock).multiplyScalar(s.cohesion);
    centering = this.steer(this.home).multiplyScalar(s.centering);
    centering.multiplyScalar(this.position.distanceTo(this.home) * this.mass); // stronger centering if farther away
    this.acceleration.add(separation);
    this.acceleration.add(alignment);
    this.acceleration.add(cohesion);
    this.acceleration.add(centering);
    this.acceleration.divideScalar(this.mass);
};

// Update Movement Vectors
Boid.prototype.update = function (reCalc) {
    this.velocity.add(this.acceleration);
    this.position.add(this.velocity);
    if (reCalc) {
        this.acceleration.set(0, 0, 0); // reset each iteration

    }
    // X-Boids point in their direction of travel, O-Boids point in their direction of acceleration
    var pointAt = (this.type) ? this.position.clone() : this.velocity.clone();
    this.obj.mesh.lookAt(pointAt);
};

// Separation Function (personal space)
Boid.prototype.separate = function (flock) {
    var minRange = 60;
    var currBoid;
    var total = new THREE.Vector3(0, 0, 0);
    var count = 0;
    // Find total weight of separation
    for (var i = 0; i < flock.length; i++) {
        currBoid = flock[i];
        var dist = this.position.distanceTo(currBoid.position);
        // Apply weight if too close
        if (dist < minRange && dist > 0) {
            var force = this.position.clone();
            force.sub(currBoid.position);
            force.normalize();
            force.divideScalar(dist);
            total.add(force);
            count++;
        }
    }
    // Average out total weight
    if (count > 0) {
        total.divideScalar(count);
        total.normalize();
    }
    return total;
};

// Alignment Function (follow neighbours)
Boid.prototype.align = function (flock) {
    var neighborRange = 100;
    var currBoid;
    var total = new THREE.Vector3(0, 0, 0);
    var count = 0;
    // Find total weight for alignment
    for (var i = 0; i < flock.length; i++) {
        currBoid = flock[i];
        var dist = this.position.distanceTo(currBoid.position);
        // Apply force if near enough
        if (dist < neighborRange && dist > 0) {
            total.add(currBoid.velocity);
            count++;
        }
    }
    // Average out total weight
    if (count > 0) {
        total.divideScalar(count);
        total.limit(1);
    }
    return total;
};

// Cohesion Function (follow whole flock)
Boid.prototype.cohesion = function (flock) {
    var neighborRange = 100;
    var currBoid;
    var total = new THREE.Vector3(0, 0, 0);
    var count = 0;
    // Find total weight for cohesion
    for (var i = 0; i < flock.length; i++) {
        currBoid = flock[i];
        var dist = this.position.distanceTo(currBoid.position);
        // Apply weight if near enough
        if (dist < neighborRange && dist > 0) {
            total.add(currBoid.position);
            count++;
        }
    }
    // Average out total weight
    if (count > 0) {
        total.divideScalar(count);
        // Find direction to steer with
        return this.steer(total);
    }
    else {
        return total;
    }
};

Boid.prototype.steer = function (target) {
    var steer = new THREE.Vector3(0, 0, 0);
    var des = new THREE.Vector3().subVectors(target, this.position);
    var dist = des.length();
    if (dist > 0) {
        des.normalize();
        steer.subVectors(des, this.velocity);
    }
    return steer;
};

// Limit max forces
THREE.Vector3.prototype.limit = function (max) {
    if (this.length() > max) {
        this.normalize();
        this.multiplyScalar(max);
    }
}

/**/
//---------------
// Render Loop
//---------------
g.rCount = 0;
let reCalc;
function render() {
    requestAnimationFrame(render);
    const delta = clock.getDelta();
    // Run iteration for each flock

    for (var i = 0; i < boids.length; i++) {
        reCalc = g.rCount % 5 == 0 ? true : false;

        boids[i].step(boids, reCalc);
    }
    if (controls) { controls.update(delta) };
    g.renderer.render(g.scene, g.camera);
    g.rCount++;
};

const init = () => {
    initRender();
    initLights();
    initFlock(500, 1);
    initSun();
    render();
}
init();