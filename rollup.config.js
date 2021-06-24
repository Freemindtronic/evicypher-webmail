import svelte from 'rollup-plugin-svelte'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import { terser } from 'rollup-plugin-terser'
import sveltePreprocess from 'svelte-preprocess'
import typescript from '@rollup/plugin-typescript'
import css from 'rollup-plugin-css-only'
import json from '@rollup/plugin-json'

const production = !process.env.ROLLUP_WATCH

const build = [
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

  // If we're building for production (npm run build
  // instead of npm run dev), minify
  production && terser(),
]

export default [
  {
    input: 'src/popup/main.ts',
    external: ['crypto'],
    output: {
      sourcemap: true,
      format: 'iife',
      name: 'app',
      file: 'extension/build/popup.js',
      globals: { crypto: 'crypto' },
    },
    plugins: [
      svelte({
        preprocess: sveltePreprocess({ sourceMap: !production }),
        compilerOptions: {
          // Enable run-time checks when not in production
          dev: !production,
        },
      }),
      // We'll extract any component CSS out into
      // a separate file - better for performance
      css({ output: 'popup.css' }),
      ...build,
    ],
    watch: {
      clearScreen: false,
    },
  },
  {
    input: 'src/background/main.ts',
    external: ['crypto'],
    output: {
      sourcemap: true,
      format: 'iife',
      name: 'app',
      file: 'extension/build/background.js',
      globals: { crypto: 'crypto' },
    },
    plugins: build,
    watch: {
      clearScreen: false,
    },
  },
  {
    input: 'src/content-scripts/gmail.ts',
    output: {
      sourcemap: true,
      format: 'iife',
      name: 'app',
      file: 'extension/build/content-script-gmail.js',
    },
    plugins: build,
    watch: {
      clearScreen: false,
    },
  },
]
