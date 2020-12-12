import * as THREE from "three"

export default class TextureLoaderManager {
    loadQ() {
        let nextInQ = this.loadingQ[0];
        // console.log(nextInQ);
        this.loader.load(nextInQ.src.substring(1), (tex) => {
            nextInQ.resolve(tex);
            this.checkLoadingQ();
        }, (err) => {
            nextInQ.reject(tex);
            this.checkLoadingQ();
        })
        this.loadingQ.shift();
    }

    checkLoadingQ() {

        if (this.loadingQ.length < 10 && this.loadingQ.length != 0) {
            this.loadQ();
        }
    }

    loadTexture(src) {
        return new Promise((resolve, reject) => {
            this.loadingQ.push({ resolve, reject, src });
            this.checkLoadingQ();
        })

    }
    constructor() {
        this.loader = new THREE.TextureLoader();
        this.textures = [];
        this.loadingQ = [];
    }
}