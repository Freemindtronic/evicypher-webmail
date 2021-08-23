import alias from '@rollup/plugin-alias'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import resolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import typescript from '@rollup/plugin-typescript'
import css from 'rollup-plugin-css-only'
import svelte from 'rollup-plugin-svelte'
import { svelteSVG } from 'rollup-plugin-svelte-svg'
import { config } from './svelte.config'

import webmails from './webmails.json'

const production = !process.env.ROLLUP_WATCH

/** Plugins used for all files. */
const plugins = [
  alias({
    entries: { $: 'src' },
  }),
  resolve({
    browser: true,
    preferBuiltins: false,
    dedupe: ['svelte'],
  }),
  json(),
  commonjs(),
  typescript({
    sourceMap: true,
    inlineSources: true,
  }),
  replace({
    values: {
      'process.env.NODE_ENV': JSON.stringify(
        production ? 'production' : 'development'
      ),
    },
    preventAssignment: true,
  }),
  svelteSVG(),
]

export default [
  {
    input: 'src/popup/main.ts',
    // `crypto` is required by the popup because of phones->certificate->utils
    external: ['crypto'],
    output: {
      file: 'build/popup.js',
      globals: { crypto: 'crypto' },
    },
    plugins: [svelte(config(production)), css({ output: 'popup.css' })],
  },
  {
    input: 'src/zeroconf-unavailable/main.ts',
    output: {
      file: 'build/zeroconf-unavailable.js',
    },
    plugins: [
      svelte(config(production)),
      css({ output: 'zeroconf-unavailable.css' }),
    ],
  },
  {
    input: 'src/evifile/main.ts',
    output: {
      file: 'build/evifile.js',
    },
    plugins: [svelte(config(production)), css({ output: 'evifile.css' })],
  },
  ...Object.keys(webmails).map((webmail) => ({
    input: `src/content-scripts/${webmail}.ts`,
    output: {
      file: `build/content-script-${webmail}.js`,
    },
    plugins: [
      svelte({
        ...config(production),
        emitCss: false,
      }),
    ],
  })),
].map((entry) => ({
  ...entry,
  output: {
    ...entry.output,
    // Add common output configuration
    sourcemap: true,
    format: 'iife',
    name: 'main',
  },
  // Add common plugins
  plugins: [...(entry.plugins ?? []), ...plugins],
}))
