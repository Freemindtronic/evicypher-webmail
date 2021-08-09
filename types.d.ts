// https://www.npmjs.com/package/rollup-plugin-svelte-svg allows importing SVGs as Svelte components
declare module '*.svg' {
  import { SvelteComponent } from 'svelte'
  export default SvelteComponent
}

/**
 * This variable does not exist in the browser, but it is a convention to
 * replace `process.env.NODE_ENV` with a string during compilation. This allows
 * to remove debug code during compilation.
 *
 * ```ts
 * if (process.env.NODE_ENV !== 'production') {
 *   console.log('App loaded')
 * }
 * ```
 *
 * For instance, in the code above, the `console.log` is completely removed in a
 * production build.
 *
 * `process.env.NODE_ENV` appears in the extension code as well as in some dependencies.
 */
declare let process: {
  env: {
    /** To ensure consistency, compare NODE_ENV to 'production' only. */
    NODE_ENV: 'production' | 'development'
  }
}
