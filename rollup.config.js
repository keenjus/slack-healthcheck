// rollup.config.js
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';

export default {
    input: 'src/index.ts',
    output: {
        dir: 'output',
        format: 'cjs'
    },
    plugins: [
        json(),
        typescript(),
        nodeResolve(),
        commonjs(),
    ],
};