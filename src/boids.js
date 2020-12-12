import BoidsController from './boids/BoidsController.js'
import Scene from './Scene.js'
import ControlHelper from './boids/ControlHelper.js'
import BoidsWorkerPlanner from './boids/BoidsWorkerPlanner.js'

// import tracking from "tracking"





class Application {
    constructor() {
        this.flockEntityCount = 1000;
        this.obstacleEntityCount = 100;
        this.simpleRenderer = undefined;
        this.boidsController = undefined;
        this.controlHelper = undefined;
        this.workerPlanner = undefined;
        this.iterateRequested = false;
    }



    initCamera() {
        var video = document.querySelector("#cam");
        let canvas = document.querySelector("#preview");
        let popup = document.querySelector(".popup");

        let record = document.querySelector("#record");
        let retry = document.querySelector("#retry");
        let submit = document.querySelector("#submit");

        let context = canvas.getContext("2d");

        if (navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(function (stream) {
                    video.srcObject = stream;
                    video.play();
                    // initTracker();

                })
                .catch(function (err0r) {
                    console.log("Something went wrong!");
                });
        }
        record.addEventListener("mouseup", () => {
            let b_overlay = document.querySelector("#overlay").getBoundingClientRect();
            let b_video = video.getBoundingClientRect();

            canvas.width = b_overlay.width;
            canvas.height = b_overlay.height;

            let x = (b_overlay.width - b_video.width) / 2;
            let y = b_video.top - b_overlay.top;
            context.drawImage(video, x, y, b_video.width, b_video.height);
            popup.classList.add("isConfirming");
        })
        submit.addEventListener("click", () => {
            popup.classList.add("hide");

            var dataURL = canvas.toDataURL();
            let formData = new FormData();
            formData.append("myFile", dataURL);

            fetch("http://localhost:3031/upload-avatar", {
                method: 'POST',
                body: formData
            })
                .then(res => res.json())
                .then(id => {
                    console.log(`../uploads/${id}.png`);
                    this.controlHelper.addBoid(`../uploads/${id}.png`)
                        .then((entity) => {
                            console.log(entity.mesh);
                            this.sceneManager.scene.add(entity.mesh);
                            this.sceneManager.isSimulating = true;
                            this.sceneManager.followBall(entity.mesh);
                        })
                });
        })

        retry.addEventListener("click", () => {
            popup.classList.remove("isConfirming");
        })

    }

    initAvatars(base) {
        fetch(`${base}/avatars`).then(
            response => response.json() // if the response is a JSON object
        ).then((avatars) => {
            console.log(avatars);
            this.avatars = avatars;
            this.initBoids();
        })
    }

    initBoids() {
        this.boidsController = new BoidsController(5000, 5000, 5000, 10);
        this.sceneManager = new Scene({ boidsController: this.boidsController, avatars: this.avatars });
        this.sceneManager.init();
        this.workerPlanner = new BoidsWorkerPlanner(this.boidsController, this.onWorkerUpdate.bind(this));
        this.workerPlanner.init();
        this.controlHelper = new ControlHelper(this.boidsController, this.sceneManager, this.workerPlanner);
        this.controlHelper.init();
        this.controlHelper.addBoids(this.flockEntityCount);
        window.requestAnimationFrame(this.render.bind(this));
    }

    render() {
        if (!this.iterateRequested) {
            this.workerPlanner.requestIterate();
            this.iterateRequested = true;
        }
        this.sceneManager.render();
        window.requestAnimationFrame(this.render.bind(this));
    }

    onWorkerUpdate() {
        this.iterateRequested = false;
    }
}






const base = "http://localhost:3031"; // https://collectivesun.samenschool.org/server

let app = new Application();
app.initCamera();
app.initAvatars(base);





