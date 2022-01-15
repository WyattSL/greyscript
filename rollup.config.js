const path = require('path');
const commonjs = require('@rollup/plugin-commonjs');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const { babel } = require('@rollup/plugin-babel');
const { terser } = require('rollup-plugin-terser');
const json = require('@rollup/plugin-json');
const nodePolyfills = require('rollup-plugin-polyfill-node');

const options = {
    input: 'out/extension.js',
    output: {
        file: 'out/extension.browser.js',
        name: 'greyscript',
        format: 'iife',
        globals: {
            'vscode': 'vscode'
        }
    },
    plugins: [
        json(),
        commonjs(),
        nodePolyfills(),
        nodeResolve({
            preferBuiltins: false
        }),
        babel({
            presets: ['@babel/preset-env'],
            babelHelpers: 'bundled'
        }),
        terser()
    ],
    external: [
        'vscode'
    ]
};

export default options;