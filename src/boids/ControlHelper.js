import Stats from '../three/stats.module.js'
import dat from '../three/dat.gui.module.js'

import Entity from './Entity.js'

let stats = undefined;
import * as THREE from "three"

/**
 * @module ControlHelper 
 * A helper class to make examples easier.
 */
export default class ControlHelper {
    constructor(boidsController, sceneManager, workerPlanner) {
        this.boidsController = boidsController;
        this.sceneManager = sceneManager;
        this.workerPlanner = workerPlanner;
        this.loader = new THREE.TextureLoader();

    }

    init() {
        // init stats
        /*         this.stats = new Stats();
                this.stats.showPanel(0); */
        // document.body.appendChild(this.stats.dom);

        const gui = new dat.GUI();

        gui.add(this.boidsController, 'aligmentWeight', 0, 5).name('Alignment');
        gui.add(this.boidsController, 'cohesionWeight', 0, 5).name('Cohesion');
        gui.add(this.boidsController, 'separationWeight', 0, 5).name('Separation');
        gui.add(this.boidsController, 'maxEntitySpeed', 1, 10).name('Max Speed');
        gui.add(this.sceneManager, 'bloom_exposure', 0, 2).onChange((value) => {
            this.sceneManager.renderer.toneMappingExposure = 2;
        });
        gui.add(this.sceneManager, 'bloom_strength', 0, 4).onChange((value) => {
            this.sceneManager.bloomPass.strength = Number(value);
        });
        gui.add(this.sceneManager, 'bloom_treshold', 0, 1).onChange((value) => {
            this.sceneManager.bloomPass.threshold = Number(value);
        });
        gui.add(this.sceneManager, 'bloom_radius', 0, 1).onChange((value) => {
            this.sceneManager.bloomPass.radius = Number(value);
        });
        gui.add(this.boidsController, 'gravPull', 0.1, 20).onChange((value) => {
            this.boidsController.gravPull = Number(value);
        });

        gui.add(this.sceneManager, 'lockOn').name('Lock Camera');
        this.boidsButton = gui.add(this, 'addBoids');

        this.updateButtonLabels();
    }

    statBegin() {
        this.stats.begin();
    }

    statEnd() {
        this.stats.end();
    }

    getRandVec() {
        let dir = { x: Math.random() - 0.5, y: Math.random() - 0.5, z: Math.random() - 0.5 };
        let dist = Math.hypot(dir.x, dir.y, dir.z);
        return { x: dir.x / dist, y: dir.y / dist, z: dir.z / dist };
    }
    getRandPos(r, o) {
        let dir = this.getRandVec();
        r = 25;
        return { x: dir.x * r + o, y: dir.y * r + o, z: dir.z * r + o };
    }

    addBoids(count = 50) {
        const boundary = this.boidsController.getBoundary();

        for (let i = 0; i < count; i++) {
            let pos = this.getRandPos(boundary[0] / 4, boundary[0] / 2);
            const vx = (Math.random() * 4) - 2;
            const vy = (Math.random() * 4) - 2;
            const vz = (Math.random() * 4) - 2;
            const entity = new Entity(Entity.FLOCK_ENTITY, pos.x, pos.y, pos.z, vx, vy, vz);
            this.boidsController.addFlockEntity(entity);
        }

        if (this.workerPlanner) {
            this.workerPlanner.sendInitialData();
        }

        this.updateButtonLabels();
    }

    addBoid(src) {
        return new Promise((resolve) => {
            const b = this.boidsController.getBoundary();
            let o = this.sceneManager.origin;

            let mesh = new THREE.Mesh(this.sceneManager.entityGeometry, this.sceneManager.entityMaterial);
            mesh.localVelocity = { x: 0, y: 0, z: 0 };
            mesh.position.set(o.x, o.y, o.z);

            const vx = (Math.random() * 4) - 2;
            const vy = (Math.random() * 4) - 2;
            const vz = (Math.random() * 4) - 2;

            const entity = new Entity(Entity.FLOCK_ENTITY, o.x + 10, o.y + 10, o.z, vx, vy, vz, mesh);

            this.loader.load(src.substring(1), (tex) => {
                let material = new THREE.MeshPhongMaterial();
                material.map = tex;
                mesh.material = material;

                this.boidsController.addFlockEntity(entity);
                if (this.workerPlanner) {
                    this.workerPlanner.sendInitialData();
                }

                this.updateButtonLabels();
                resolve(entity);
            })




        })

    }



    updateButtonLabels() {
        this.boidsButton.name('Add Boids (' + this.boidsController.getFlockEntities().length + ')');
    }
}