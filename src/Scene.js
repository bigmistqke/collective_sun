/**
 * @module SimpleRenderer 
 * SimpleRenderer helps visualizing the entities in the BoidsController and controls the camera.
 */
import TextureLoaderManager from "./three/TextureLoaderManager.js"
import { RenderPass } from './three/postprocessing/RenderPass.js';
import { UnrealBloomPass } from './three/postprocessing/UnrealBloomPass.js';
import { EffectComposer } from './three/postprocessing/EffectComposer.js';

import * as THREE from "three"

export default class Scene {
    constructor({ boidsController, avatars }) {
        this.boidsController = boidsController;
        this.isDragging = false;
        this.mouseX = 0;
        this.mouseY = 0;
        this.degX = 0;
        this.degY = 0;
        const b = this.boidsController.getBoundary();
        this.cameraMax = Math.max(b[0], b[1], b[2]) * 2;
        this.cameraRadius = 500;
        this.lockOn = false;
        this.textureLoaderManager = new TextureLoaderManager();
        this.avatars = avatars;

    }

    followBall(mesh) {

        mesh.add(this.camera);
        this.camera.position.set(0, 25, 250);
        this.camera.rotation.set(0, 0, 0);
    }

    followRandomBall() {
        const entities = this.boidsController.getFlockEntities();
        let entity = entities[Math.floor(Math.random() * entities.length)];
        this.followBall(entity.mesh);
    }

    keyDown(e) {
        console.log(e.code);
        if (e.code === "Space") {
            this.followRandomBall();
        }
        if (e.code === "Escape") {
            this.camera.position.set(0, 0, 0);
            this.camera.rotation.set(0, 0, 0);
            this.scene.add(this.camera);
            this.updateCamera();

        }
    }

    resize() {
        let width = window.innerWidth;
        let height = window.innerHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(width, height);
        this.composer.setSize(width, height);
    }

    initSun() {
        let sunTexture;
        let count = 0;
        let xAmount = 3;
        let yAmount = 2;

        function spriteAnimate() {
            let xOffs = count % xAmount / xAmount;
            let yOffs = Math.floor(count / xAmount) % yAmount / yAmount;
            sunTexture.offset.set(xOffs, yOffs);
            count++;
            setTimeout(spriteAnimate, 2000);
        }

        this.loader.load(
            "./sun/sprite.png",
            (texture) => {
                console.log("SUUUUUUUUUN");
                sunTexture = texture;
                const material = new THREE.MeshBasicMaterial({
                    map: sunTexture,
                    side: THREE.DoubleSide,
                });
                sunTexture.repeat.set(0.33333, 0.5);

                let sphere = new THREE.Mesh(this.entityGeometry, material);

                this.sun = sphere;
                this.sun.scale.set(50, 50, 50);
                this.sun.position.set(this.origin.x, this.origin.y, this.origin.z);
                this.scene.add(sphere);
                spriteAnimate();
                this.render();
            },
            undefined,
            function (err) {
                console.error('An error happened.');
            }
        );



    }


    init() {
        this.camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.01, 100000);
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
        this.loader = new THREE.TextureLoader();

        this.entityGeometry = new THREE.SphereGeometry(20);
        this.obstacleGeometry = new THREE.SphereGeometry(50, 15, 15);
        this.entityMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffff00) });
        this.obstacleMaterial = new THREE.MeshNormalMaterial();

        const b = this.boidsController.getBoundary();
        this.origin = { x: b[0] / 2, y: b[1] / 2, z: b[2] / 2 };

        const light = new THREE.AmbientLight(0x404040); // soft white light
        this.scene.add(light);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        this.initSun();

        // bloom

        this.bloom_exposure = 1;
        this.bloom_strength = 1.7;
        this.bloom_treshold = 0;
        this.bloom_radius = 0;

        this.bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
        this.bloomPass.threshold = this.bloom_treshold;
        this.bloomPass.strength = this.bloom_strength;
        this.bloomPass.radius = this.bloom_radius;

        this.renderScene = new RenderPass(this.scene, this.camera);
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(this.renderScene);
        this.composer.addPass(this.bloomPass);


        // events
        this.renderer.domElement.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.renderer.domElement.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.renderer.domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.renderer.domElement.addEventListener('wheel', this.onMouseWheel.bind(this));
        this.renderer.domElement.addEventListener('touchstart', this.touchStart.bind(this), false);
        this.renderer.domElement.addEventListener('touchmove', this.touchMove.bind(this), false);
        this.renderer.domElement.addEventListener('touchend', this.touchEnd.bind(this), false);

        window.addEventListener('resize', this.resize.bind(this), false);
        document.body.addEventListener("keydown", this.keyDown.bind(this), false);

        this.updateCamera();
        this.render();
    }

    touchStart(e) {
        const t = e.changedTouches[0];
        this.mouseX = t.pageX;
        this.mouseY = t.pageY;
        this.isDragging = true;
    }

    touchEnd(e) {
        this.isDragging = false;
    }

    touchMove(e) {
        if (!this.isDragging) {
            return;
        }

        e.preventDefault();

        const t = e.changedTouches[0];

        const dx = t.pageX - this.mouseX;
        const dy = t.pageY - this.mouseY;

        this.mouseX = t.pageX;
        this.mouseY = t.pageY;

        this.degX += dx;
        if (this.degX > 360) this.degX = 0;
        if (this.degX < 0) this.degX = 360;

        this.degY += dy / 3;
        this.degY = Math.max(0.1, this.degY);
        this.degY = Math.min(179.9, this.degY);

        this.updateCamera();
    }

    onMouseDown(e) {
        this.isDragging = true;
        this.mouseX = e.offsetX;
        this.mouseY = e.offsetY;
    }

    onMouseMove(e) {
        if (!this.isDragging) {
            return;
        }

        const dx = e.offsetX - this.mouseX;
        const dy = e.offsetY - this.mouseY;

        this.mouseX = e.offsetX;
        this.mouseY = e.offsetY;

        this.degX += dx;
        if (this.degX > 360) this.degX = 0;
        if (this.degX < 0) this.degX = 360;

        this.degY += dy / 3;
        this.degY = Math.max(0.1, this.degY);
        this.degY = Math.min(179.9, this.degY);

        this.updateCamera();
    }

    onMouseUp(e) {
        this.isDragging = false;
    }

    onMouseWheel(e) {
        e.preventDefault();
        this.cameraRadius += e.deltaY * -2;
        this.cameraRadius = Math.max(1, this.cameraRadius);
        this.cameraRadius = Math.min(this.cameraMax, this.cameraRadius);
        this.updateCamera();
    }

    updateCamera() {
        let mx = 0, my = 0, mz = 0;
        const entities = this.boidsController.getFlockEntities();
        if (this.lockOn && entities.length > 0) {
            const mesh = entities[0].mesh;
            mx = mesh.position.x;
            my = mesh.position.y;
            mz = mesh.position.z;
        } else {
            const b = this.boidsController.getBoundary();
            mx = b[0] / 2;
            my = b[1] / 2;
            mz = b[2] / 2;
        }

        const degXPI = this.degX * Math.PI / 180;
        const degYPI = this.degY * Math.PI / 180;
        this.camera.position.x = mx + Math.sin(degXPI) * Math.sin(degYPI) * this.cameraRadius;
        this.camera.position.z = mz + Math.cos(degXPI) * Math.sin(degYPI) * this.cameraRadius;
        this.camera.position.y = my + Math.cos(degYPI) * this.cameraRadius;

        this.camera.lookAt(mx, my, mz);
    }



    render() {
        const entities = this.boidsController.getFlockEntities();
        entities.forEach((entity, i) => {
            const x = entity.x;
            const y = entity.y;
            const z = entity.z;
            const vx = entity.vx;
            const vy = entity.vy;
            const vz = entity.vz;
            let mesh = entity.mesh;
            if (!mesh) {
                const b = this.boidsController.getBoundary();

                mesh = new THREE.Mesh(this.entityGeometry, this.entityMaterial);
                mesh.localVelocity = { x: 0, y: 0, z: 0 };
                mesh.position.set(entity.x, entity.y, entity.z);
                this.scene.add(mesh);
                entity.mesh = mesh;
                console.log(entity.avatar);
                let avatar = entity.avatar ? entity.avatar : this.avatars.files[(i % this.avatars.files.length)];
                this.textureLoaderManager.loadTexture(avatar).then((texture) => {
                    let material = new THREE.MeshPhongMaterial();
                    material.map = texture;
                    mesh.material = material;
                });

            } else {
                if (this.isSimulating) {
                    let s = 0.9;
                    let _s = 1 - s;

                    if (!("localVelocity" in mesh)) {
                        console.log(mesh);
                    }

                    mesh.position.x = s * mesh.position.x + _s * x;
                    mesh.position.y = s * mesh.position.y + _s * y;
                    mesh.position.z = s * mesh.position.z + _s * z;
                    mesh.localVelocity.x = s * mesh.localVelocity.x + _s * vx;
                    mesh.localVelocity.y = s * mesh.localVelocity.y + _s * vy;
                    mesh.localVelocity.z = s * mesh.localVelocity.z + _s * vz;

                    mesh.lookAt(mesh.position.x + mesh.localVelocity.x,
                        mesh.position.y + mesh.localVelocity.y,
                        mesh.position.z + mesh.localVelocity.z);
                }

            }


        });



        if (this.lockOn && entities.length > 0) {
            this.updateCamera();
        }
        if (this.sun) {
            this.sun.rotation.y += 0.001;
        }
        this.composer.render();

        // this.renderer.render(this.scene, this.camera);
    }
}