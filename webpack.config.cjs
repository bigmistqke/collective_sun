let path = require("path");

module.exports = {
    entry: {
        index: './src/index.js',
        flock: './src/flock.js',
        boids: './src/boids.js',
        boids_worker: './src/boids/BoidsWorker.js',
    },
    mode: 'development',
    watch: true,
    output: {
        filename: '[name].js',
        path: __dirname + '/dist'
    },
    optimization: {
        minimize: true
    },
};