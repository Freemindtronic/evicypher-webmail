import preprocess from 'svelte-preprocess'

/**
 * Produces the configuration to compile Svelte files.
 *
 * @param {boolean} production - Whether files should contain run-time checks
 * @returns {module:@sveltejs/kit.Config}
 */
const config = (production) => ({
  preprocess: preprocess({
    sourceMap: !production,
    scss: {
      prependData: `@use 'src/assets/variables.scss' as *;`,
    },
  }),
  compilerOptions: {
    // Enable run-time checks when not in production
    dev: !production,
  },
})

export { config }
export default config(false)
