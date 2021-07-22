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

/** Plugins used for all files. */
const plugins = [
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
  production && terser(),
]

export default [
  {
    input: 'src/popup/main.ts',
    // `crypto` is required by the popup because of phones->certificate->utils
    external: ['crypto'],
    output: {
      file: 'extension/build/popup.js',
      globals: { crypto: 'crypto' },
    },
    plugins: [svelte(config(production)), css({ output: 'popup.css' })],
  },
  {
    input: 'src/evifile/main.ts',
    output: {
      file: 'extension/build/evifile.js',
    },
    plugins: [svelte(config(production)), css({ output: 'evifile.css' })],
  },
  {
    input: 'src/background/main.ts',
    external: ['crypto'],
    output: {
      file: 'extension/build/background.js',
      globals: { crypto: 'crypto' },
    },
  },
  {
    input: 'src/content-scripts/gmail.ts',
    output: {
      file: 'extension/build/content-script-gmail.js',
    },
    plugins: [
      svelte({
        ...config(production),
        emitCss: false,
      }),
    ],
  },
].map((entry) => ({
  ...entry,
  output: {
    ...entry.output,
    // Add common output configuration
    sourcemap: !production,
    format: 'iife',
    name: 'main',
  },
  // Add common plugins
  plugins: [...(entry.plugins ?? []), ...plugins],
}))
