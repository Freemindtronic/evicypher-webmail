import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import resolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import typescript from '@rollup/plugin-typescript'
import css from 'rollup-plugin-css-only'
import svelte from 'rollup-plugin-svelte'
import { svelteSVG } from 'rollup-plugin-svelte-svg'
import { terser } from 'rollup-plugin-terser'

import { config } from './svelte.config'

const production = !process.env.ROLLUP_WATCH

const plugins = [
  // If you have external dependencies installed from
  // npm, you'll most likely need these plugins. In
  // some cases you'll need additional configuration -
  // consult the documentation for details:
  // https://github.com/rollup/plugins/tree/master/packages/commonjs
  resolve({
    browser: true,
    preferBuiltins: false,
    dedupe: ['svelte'],
  }),
  json(),
  commonjs(),
  typescript({
    sourceMap: !production,
    inlineSources: !production,
  }),
  replace({
    values: {
      'process.env.NODE_ENV': JSON.stringify(
        production ? 'production' : 'development'
      ),
    },
    preventAssignment: true,
  }),
  svelteSVG({ dev: !production }),

  // If we're building for production, minify
  production && terser(),
]

export default [
  {
    input: 'src/popup/main.ts',
    external: ['crypto'],
    output: {
      sourcemap: !production,
      format: 'iife',
      name: 'app',
      file: 'extension/build/popup.js',
      globals: { crypto: 'crypto' },
    },
    plugins: [
      svelte(config(production)),
      // We'll extract any component CSS out into
      // a separate file - better for performance
      css({ output: 'popup.css' }),
      ...plugins,
    ],
    watch: {
      clearScreen: false,
    },
  },
  {
    input: 'src/background/main.ts',
    external: ['crypto'],
    output: {
      sourcemap: !production,
      format: 'iife',
      name: 'app',
      file: 'extension/build/background.js',
      globals: { crypto: 'crypto' },
    },
    plugins,
    watch: {
      clearScreen: false,
    },
  },
  {
    input: 'src/content-scripts/gmail.ts',
    external: ['crypto'],
    output: {
      sourcemap: !production,
      format: 'iife',
      name: 'app',
      file: 'extension/build/content-script-gmail.js',
      globals: { crypto: 'crypto' },
    },
    plugins: [
      svelte({
        ...config(production),
        emitCss: false,
      }),
      ...plugins,
    ],
    watch: {
      clearScreen: false,
    },
  },
]
