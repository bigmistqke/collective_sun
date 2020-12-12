const g = {};

g.loader = new THREE.TextureLoader();

const webcamElement = document.querySelector('#webcam');
const canvasElement = document.querySelector('#webcam__canvas');
const threejs = document.querySelector('#threejs');

window.THREE.FileLoader.prototype.setRequestHeader('crossOrigin', '')

const base = "http://localhost:3031"; // https://collectivesun.samenschool.org/server

g.spheres = [];
g.geometry = new THREE.SphereGeometry(5, 64, 64);


console.log('"ok');

const initPicture = () => {
    const webcam = new Webcam(webcamElement, 'user', canvasElement);

    webcam.start().then((result) => {
        setTimeout(() => {
            var picture = webcam.snap();
            sendPicture(picture);
        }, 500);
    });

    const sendPicture = (picture) => {
        let formData = new FormData();
        formData.append('myFile', picture);

        fetch(`${base}/upload-avatar`, {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            credentials: 'same-origin',
            body: formData
        }).then(
            response => response.json() // if the response is a JSON object
        ).then(
            success => console.log(success) // Handle the success response object
        ).catch(
            error => console.log(error) // Handle the error response object
        );
    }
}


let r = () => {
    return Math.random() * 250 - 125;
}

const getAvatars = async () => {
    let promise = new Promise((resolve, reject) => {
        fetch(`${base}/avatars`).then(
            response => response.json() // if the response is a JSON object
        ).then(
            success => resolve(success)
        )
    })
    return promise;
};



const addSphere = async (src) => {
    return new Promise((resolve) => {
        g.loader.load(
            src,
            function (texture) {
                const material = new THREE.MeshBasicMaterial({
                    map: texture
                });
                let sphere = new THREE.Mesh(g.geometry, material);
                resolve(sphere);
            },
            undefined,
            function (err) {
                console.error('An error happened.');
            }
        );
    })
}

const rDegree = () => {
    return Math.random() * 360 - 180;
}

const addSpheres = (data) => {
    console.log(data);
    // let material = new THREE.MeshBasicMaterial();

    data.forEach(src => {
        src = src.substring(1);
        addSphere(src).then(sphere => {
            let position = new THREE.Vector3();
            let radius = Math.random() * 250 + 125;
            let container = new THREE.Group();
            container.add(sphere);
            let tinyDegree = () => {
                let max = 0.2;
                let r = Math.random() * max;
                return r - max / 2;
            }
            container.rotation.set(rDegree(), tinyDegree(), rDegree() / 80);
            sphere.position.set(0, 0, radius);
            // container.position.set(r(), r(), r())
            // container.rotation.x = Math.random() * Math.PI / 2;

            g.spheres.push({
                container: container,
                speed: Math.random() * 5 + 0.25,
                xStart: Math.random() * Math.PI * 2
            });
            g.scene.add(container);
        });


    })
}

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
            sunTexture = texture;
            const material = new THREE.MeshBasicMaterial({
                map: sunTexture,
                side: THREE.DoubleSide
            });
            sunTexture.repeat.set(0.33333, 0.5);

            let sphere = new THREE.Mesh(g.geometry, material);

            g.sun = sphere;
            g.sun.scale.set(100, 100, 100);
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

const initThree = () => {
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    // renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.domElement.id = "threejs";

    document.body.appendChild(renderer.domElement);
    g.scene = new THREE.Scene();
    // scene.background = new THREE.Color(0xbfe3dd);

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 4000);
    camera.position.set(0, 0, -100);
    const controller = new THREE.OrbitControls(camera, renderer.domElement);

    initSun();


    function onResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    window.addEventListener('resize', onResize, false);

    // sphere.position.set({ x: 0, y: 0, z: 0 });
    var lastTime;
    const animate = (now) => {
        requestAnimationFrame(animate);
        if (!lastTime) { lastTime = now; return }
        var delta = lastTime - now;

        delta = delta / 10000000;
        camera.rotation.X = Math.sin(now);
        controller.update();
        g.spheres.forEach(sphere => {
            sphere.container.rotation.x = sphere.xStart + Math.sin(now / 100000 * sphere.speed) * Math.PI * 2;
        })
        /*         if (g.sun) {
                    g.sun.rotation.x += delta / 2;
                } */
        // lastTime = now;
        renderer.render(g.scene, camera);
    }
    animate();
}

const updateSun = () => {
    fetch(`${base}/update-sun`)
        .then(() => { });
}

const init = () => {
    initThree()
    getAvatars().then(
        res => { console.log(res); addSpheres(res.files); }
    )
    updateSun();
}
init();


