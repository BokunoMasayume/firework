import * as path from 'node:path';
import * as url from 'node:url';
import * as fs from 'node:fs';
import { terser as uglify} from 'rollup-plugin-terser';
import livereload from 'rollup-plugin-livereload';
import serve from 'rollup-plugin-serve';
import {babel} from '@rollup/plugin-babel';
import typescript from 'rollup-plugin-typescript2';
import dts from 'rollup-plugin-dts';
import {string} from 'rollup-plugin-string';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const extensions = ['.d.ts', 'tsx', '.ts', '.js', '.json'];

const baseTsconfig = path.resolve(__dirname, 'tsconfig.json');

// import package.json
const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'package.json'), {encoding: 'utf-8'}));

const plugins = process.env.NODE_ENV !== 'prod' ? [
    serve({
        contentBase: '',
        port: 9999,
        openPage: '/demo/index.html',

    }),
    livereload(),
] : [
    uglify(),
];
export default [
    {
        input: 'src/index.ts',
        output: [
            {
                file: pkg.exports['.'].import,
                format: 'es'
            },
            {
                file: pkg.exports['.'].require,
                format: 'cjs'
            }
        ],
        plugins: [
            string({
                include: ['**/*.glsl', "**/*.vert", "**/*.frag"],
            }),
            typescript({
                tsconfig: baseTsconfig,
                clean: true,
                rollupCommonJSResolveHack: false,
                tsconfigOverride: {
                    compilerOptions: {
                        target: 'es5',
                        declaration: false,
                        emitDeclarationOnly: false,
                    }
                }
            }),
            babel({
                babelHelpers: 'runtime',
                extensions,
                exclude: [
                    '**/node_modules/**',
                    '**/dist/**'
                ]
            }),
            ...plugins,
        ]
    },
    {
        input: 'src/index.ts',
        output: [
            {
                file: pkg.exports['.'].require.replace(/\.cjs$/, '.d.cts'),
            },
            {
                file: pkg.exports['.'].import.replace(/\.mjs$/, '.d.mts'),
            }
        ],
        plugins: [
            dts({
                respectExternal: true,
                tsconfig: baseTsconfig,
                compilerOptions: {
                    preserveSymlinks: false,
                }
            }),
        ]
    }
]