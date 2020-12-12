import express from "express";
import { v4 as uuidv4 } from "uuid";
import cors from "cors";
import glob from "glob";
import formidable from "formidable";
import fs from "fs";
import fetch from "node-fetch";
import extractFrames from "gif-extract-frames";
import CANVAS from "canvas";
import { resolve } from "path";
// const { createCanvas, loadImage } = require('canvas')


const app = express();
app.use(cors());

const port = 3031;

app.listen(port, () =>
    console.log(`App is listening on port ${port}.`)
);

app.post('/upload-avatar', async (req, res) => {
    const form = formidable({ multiples: true });
    form.parse(req, (err, fields, files) => {
        if (Object.keys(fields).length == 0) return;
        let picture = fields.myFile.replace(/^data:image\/\w+;base64,/, "");
        var buf = new Buffer.from(picture, 'base64');
        let id = uuidv4();

        fs.writeFile(`../uploads/${id}.png`, buf, function (err) {
            if (err) return console.log(err);
            res.writeHead(200, { 'content-type': 'application/json' });
            res.end(JSON.stringify(id));
        });

    });
})


app.get('/avatars', async (req, res) => {
    glob("../uploads/*", null, function (er, files) {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ files }, null, 2));
    })
})

app.get('/', async (req, res) => {
    console.log("test");
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Hello World\n')
})

function createSpritesheet(amount, path) {
    let canvas = CANVAS.createCanvas();
    let context = canvas.getContext("2d");
    canvas.width = 2048;
    canvas.height = 2048;
    let xAmount = 3;
    let yAmount = 2;
    let promises = [];

    for (let i = 0; i < amount; i++) {
        let xOffs = i % xAmount * canvas.width / xAmount;
        let yOffs = Math.floor(i / xAmount) * canvas.height / yAmount;
        const drawImage = (path, i) => {
            return new Promise((resolve) => {
                CANVAS.loadImage(`${path}/frame-${i}.png`).then((image) => {
                    context.drawImage(
                        image,
                        1024 / 3,
                        1024 / 3,
                        1024 / 3,
                        1024 / 3,
                        xOffs,
                        yOffs,
                        (canvas.width / xAmount),
                        (canvas.height / yAmount)
                    );
                    resolve();
                })
            })
        }
        promises.push(drawImage(path, i));
    }
    Promise.all(promises).then(() => {
        let picture = canvas.toDataURL().replace(/^data:image\/\w+;base64,/, "");
        var buf = new Buffer.from(picture, 'base64');
        fs.writeFile(`../sun/sprite.png`, buf, function (err) {
            if (err) return console.log(err);
        });
    })

}

async function extractFramesFromUrl(url, path) {
    const results = await extractFrames({
        input: url,
        output: `${path}/frame-%d.png`
    }).then((array) => {
        console.log(array.shape);
        createSpritesheet(array.shape[0], path);
    })
}

app.get('/update-sun', async (req, res) => {
    const url = "http://www.sunstream.tv/nasa.gif";
    extractFramesFromUrl(url, "../sun");
    /*     async function download(url) {
            const response = await fetch(url);
            const buffer = await response.buffer();
            const url = `../sun.gif`
            fs.writeFile(url, buffer, () => {
                console.log('finished downloading!');
                createSpritesheet(input);
            });
        }
        download(url); */

})