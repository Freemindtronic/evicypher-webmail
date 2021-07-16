import preprocess from 'svelte-preprocess'

/**
 * This will add autocompletion if you're working with SvelteKit
 *
 * @param {boolean} production
 * @returns {module:@sveltejs/kit.Config}
 */
const config = (production) => ({
  preprocess: preprocess({
    sourceMap: !production,
    scss: {
      prependData: `@use 'src/styles/variables.scss' as *;`,
    },
  }),
  compilerOptions: {
    // Enable run-time checks when not in production
    dev: !production,
  },
})

export { config }
export default config(false)
