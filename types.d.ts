// https://www.npmjs.com/package/rollup-plugin-svelte-svg allows importing SVGs as Svelte components
declare module '*.svg' {
  export default Svelte2TsxComponent
}
