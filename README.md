# A new browser extension

## Requirements

- Install [Volta](https://volta.sh/): `curl https://get.volta.sh | bash`
- Install dependencies: `yarn install`

## How to build

- Run `yarn build`

## How to contribute

- Run in watch mode `yarn start`
- Run tests `yarn test`
- Read the API documentation `yarn doc && cat docs/index.html`

## Details

### Technologies

- Language: [TypeScript](https://www.typescriptlang.org/)
- Frontend framework: [Svelte](https://svelte.dev/)
- Frontend bundler: [rollup.js](https://rollupjs.org/)
- Linters: [ESLint](https://eslint.org/) and [svelte-check](https://github.com/sveltejs/language-tools/tree/master/packages/svelte-check)
- Formatter: [Prettier](https://prettier.io/)
- Package manager: [Yarn](https://yarnpkg.com/)

### I18n (Internationalization)

The extension is fully translatable thanks to [svelte-i18n](https://github.com/kaisermann/svelte-i18n).
