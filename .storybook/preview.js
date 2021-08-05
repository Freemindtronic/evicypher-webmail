// I spent a lot of time trying to import 'assets/sanitize.scss' in vain,
// it is way too hard to create a package compatible with both rollup
// and webpack.
// This is a working solution:
import '../node_modules/sanitize.css/sanitize.css'
import '../node_modules/sanitize.css/forms.css'
import '../node_modules/sanitize.css/assets.css'
import '../node_modules/sanitize.css/typography.css'

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  // Doc pages don't support Svelte yet, see
  // https://github.com/storybookjs/storybook/tree/next/addons/docs#framework-support
  // Remove these lines once `Props table` and `Description` are supported:
  previewTabs: {
    'storybook/docs/panel': {
      hidden: true,
    },
    canvas: {
      // Hide the only remaining tab too
      hidden: true,
    },
  },
}
