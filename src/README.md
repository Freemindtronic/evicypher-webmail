# EviCypher Webmail

Encrypt and decrypt emails directly from your web browser.

## Try it

1. Download the file `extension.zip` from the [latest successful build](https://github.com/Freemindtronic/evicypher-webmail/actions?query=is%3Asuccess).
2. Load the extension using your browser developer tools.

## Architecture

[![Architecture diagram](https://mermaid.ink/img/eyJjb2RlIjoiZmxvd2NoYXJ0IFREXG4gICAgc3ViZ3JhcGggUG9wdXBcbiAgICAgICAgcHMoW1wiUGhvbmUgc3RhdHVzZXNcIl0pXG4gICAgICAgIHAoW1wiUGFpcmluZ1wiXSlcbiAgICAgICAgemMoW1wiWmVyb2NvbmYgc3RhdHVzXCJdKVxuICAgIGVuZFxuICAgIHN1YmdyYXBoIENvbnRlbnQgU2NyaXB0c1xuICAgICAgICBlKFtcIkVuY3J5cHRpb25cIl0pXG4gICAgICAgIGQoW1wiRGVjcnlwdGlvblwiXSlcbiAgICBlbmRcbiAgICBzdWJncmFwaCBFdmlGaWxlXG4gICAgICAgIGV6YyhbXCJaZXJvY29uZiBzdGF0dXNcIl0pXG4gICAgICAgIGVlKFtcIkZpbGUgZW5jcnlwdGlvblwiXSlcbiAgICAgICAgZWQoW1wiRmlsZSBkZWNyeXB0aW9uXCJdKVxuICAgIGVuZFxuICAgIHN1YmdyYXBoIEJhY2tncm91bmRcbiAgICAgICAgc3ViZ3JhcGggU2VydmljZXNcbiAgICAgICAgICAgIHpbXCJaZXJvY29uZiBcIl1cbiAgICAgICAgZW5kXG4gICAgICAgIHN1YmdyYXBoIFRhc2tzXG4gICAgICAgICAgICBicFtcIlBhaXJpbmdcIl1cbiAgICAgICAgICAgIGJ6Y1tcIlplcm9jb25mIHN0YXR1c1wiXVxuICAgICAgICAgICAgYmVlW1wiRmlsZSBlbmNyeXB0aW9uXCJdXG4gICAgICAgICAgICBiZWRbXCJGaWxlIGRlY3J5cHRpb25cIl1cbiAgICAgICAgICAgIGJlW1wiRW5jcnlwdGlvblwiXVxuICAgICAgICAgICAgYmRbXCJEZWNyeXB0aW9uXCJdXG4gICAgICAgIGVuZFxuICAgIGVuZFxuICAgIGUgPC0tPiBiZVxuICAgIHBzIDwtLT4gelxuICAgIGQgPC0tPiBiZFxuICAgIHAgPC0tPiBicFxuICAgIGVlIDwtLT4gYmVlXG4gICAgZWQgPC0tPiBiZWRcbiAgICB6YyA8LS0-IGJ6Y1xuICAgIGV6YyA8LS0-IGJ6YyIsIm1lcm1haWQiOnsidGhlbWUiOiJkZWZhdWx0In0sInVwZGF0ZUVkaXRvciI6ZmFsc2UsImF1dG9TeW5jIjp0cnVlLCJ1cGRhdGVEaWFncmFtIjpmYWxzZX0)](https://mermaid-js.github.io/mermaid-live-editor/edit/#eyJjb2RlIjoiZmxvd2NoYXJ0IFREXG4gICAgc3ViZ3JhcGggUG9wdXBcbiAgICAgICAgcHMoW1wiUGhvbmUgc3RhdHVzZXNcIl0pXG4gICAgICAgIHAoW1wiUGFpcmluZ1wiXSlcbiAgICAgICAgemMoW1wiWmVyb2NvbmYgc3RhdHVzXCJdKVxuICAgIGVuZFxuICAgIHN1YmdyYXBoIENvbnRlbnQgU2NyaXB0c1xuICAgICAgICBlKFtcIkVuY3J5cHRpb25cIl0pXG4gICAgICAgIGQoW1wiRGVjcnlwdGlvblwiXSlcbiAgICBlbmRcbiAgICBzdWJncmFwaCBFdmlGaWxlXG4gICAgICAgIGV6YyhbXCJaZXJvY29uZiBzdGF0dXNcIl0pXG4gICAgICAgIGVlKFtcIkZpbGUgZW5jcnlwdGlvblwiXSlcbiAgICAgICAgZWQoW1wiRmlsZSBkZWNyeXB0aW9uXCJdKVxuICAgIGVuZFxuICAgIHN1YmdyYXBoIEJhY2tncm91bmRcbiAgICAgICAgc3ViZ3JhcGggU2VydmljZXNcbiAgICAgICAgICAgIHpbXCJaZXJvY29uZiBcIl1cbiAgICAgICAgZW5kXG4gICAgICAgIHN1YmdyYXBoIFRhc2tzXG4gICAgICAgICAgICBicFtcIlBhaXJpbmdcIl1cbiAgICAgICAgICAgIGJ6Y1tcIlplcm9jb25mIHN0YXR1c1wiXVxuICAgICAgICAgICAgYmVlW1wiRmlsZSBlbmNyeXB0aW9uXCJdXG4gICAgICAgICAgICBiZWRbXCJGaWxlIGRlY3J5cHRpb25cIl1cbiAgICAgICAgICAgIGJlW1wiRW5jcnlwdGlvblwiXVxuICAgICAgICAgICAgYmRbXCJEZWNyeXB0aW9uXCJdXG4gICAgICAgIGVuZFxuICAgIGVuZFxuICAgIGUgPC0tPiBiZVxuICAgIHBzIDwtLT4gelxuICAgIGQgPC0tPiBiZFxuICAgIHAgPC0tPiBicFxuICAgIGVlIDwtLT4gYmVlXG4gICAgZWQgPC0tPiBiZWRcbiAgICB6YyA8LS0-IGJ6Y1xuICAgIGV6YyA8LS0-IGJ6YyIsIm1lcm1haWQiOiJ7XG4gIFwidGhlbWVcIjogXCJkZWZhdWx0XCJcbn0iLCJ1cGRhdGVFZGl0b3IiOmZhbHNlLCJhdXRvU3luYyI6dHJ1ZSwidXBkYXRlRGlhZ3JhbSI6ZmFsc2V9)

**Legend:** [![Legend](https://mermaid.ink/img/eyJjb2RlIjoiZmxvd2NoYXJ0IFREXG4gICAgcHMoW1wiVXNlciBpbnRlcmZhY2VcIl0pXG4gICAgYmRbXCJCYWNrZ3JvdW5kIGludGVyZmFjZVwiXVxuIiwibWVybWFpZCI6eyJ0aGVtZSI6ImRlZmF1bHQifSwidXBkYXRlRWRpdG9yIjpmYWxzZSwiYXV0b1N5bmMiOnRydWUsInVwZGF0ZURpYWdyYW0iOmZhbHNlfQ)](https://mermaid-js.github.io/mermaid-live-editor/edit/##eyJjb2RlIjoiZmxvd2NoYXJ0IFREXG4gICAgcHMoW1wiVXNlciBpbnRlcmZhY2VcIl0pXG4gICAgYmRbXCJCYWNrZ3JvdW5kIGludGVyZmFjXCJdXG4iLCJtZXJtYWlkIjoie1xuICBcInRoZW1lXCI6IFwiZGVmYXVsdFwiXG59IiwidXBkYXRlRWRpdG9yIjpmYWxzZSwiYXV0b1N5bmMiOnRydWUsInVwZGF0ZURpYWdyYW0iOmZhbHNlfQ)

This extension is in four parts:

- A background script, [background/main.ts](./background/main.ts), that runs in the background and communicates with phones and other devices.
- A popup, [popup/Popup.svelte](./popup/Popup.svelte), that is displayed when the user clicks on the extension icon.
- Several content scripts that are injected into the pages they target.
- Additional pages (currently: [evifile/Evifile.svelte](./evifile/Evifile.svelte) and [zeroconf-unavailable/ZeroconfUnavailable.svelte](./zeroconf-unavailable/ZeroconfUnavailable.svelte)), to provide common features.

Both tasks and services are running in the background, but they are two different kinds of work:

- A _Task_ is a single unit of work started by the user. It may require some interaction with the user.
- A _Service_ is always running in the background, started when the extension starts. It must not require interaction with the user.

### Technologies

- Language: [TypeScript](https://www.typescriptlang.org/)
- Frontend framework: [Svelte](https://svelte.dev/)
- Frontend bundlers: [rollup.js](https://rollupjs.org/) and [Parcel](https://v2.parceljs.org/)
- Linters: [ESLint](https://eslint.org/) and [svelte-check](https://github.com/sveltejs/language-tools/tree/master/packages/svelte-check)
- Formatter: [Prettier](https://prettier.io/)
- Package manager: [Yarn](https://yarnpkg.com/)
- End-to-end testing: [Cypress](https://www.cypress.io/) (Not yet implemented, consider [Playwright](https://playwright.dev/) before working on it.)
- Design: [Sass](https://sass-lang.com/), linted with [Stylelint](https://stylelint.io/)

### Repository structure

Here is a high-level overview of the repository structure:

- **.github/**: [GitHub](https://github.com/) specific files.
  - **workflows/**: Workflow files for [GitHub Actions](https://docs.github.com/en/actions/learn-github-actions/introduction-to-github-actions).
- **.husky/**: [Git hooks](https://githooks.com/) managed by [Husky](https://typicode.github.io/husky/).
- **.storybook/**: [Storybook](https://storybook.js.org/) configuration files.
- **.vscode/**: [VS Code](https://code.visualstudio.com/) specific files, contains settings and recommended extensions.
- **.yarn/**: [Yarn](https://yarnpkg.com/) specific files, contains a lot of zip files because [Zero-Installs](https://yarnpkg.com/features/zero-installs) are enabled.
- **assets/**: Assets to be processed, such as fonts.
- **cypress/**: [Cypress](https://www.cypress.io/) end-to-end testing specification files.
- **extension/**: The extension itself, loadable after running `yarn build`.
- **src/**: Source directory.
  - **assets/**: Common stylesheets and images.
  - **background/**: Main background script, tasks and services.
  - **components/**: Common Svelte components, such as buttons.
  - **content-scripts/**: Scripts injected in pages.
  - **evifile/**: EviFile components.
  - **legacy-code/**: Code to be refactored, [inherited](https://en.wikipedia.org/wiki/Technical_debt) from the previous extension.
  - **pages/**: [Nunjucks](https://www.11ty.dev/docs/languages/nunjucks/) templates used to produce plain HTML.
  - **popup/**: Popup components.
  - **stories/**: Style-guide written with [Storybook](https://storybook.js.org/).
  - **\*.ts**: Common libraries.
  - **README.md**: _This file._
- **static/**: Static resources, to be copied as is.
  - **locales/**: Translation files, bound to a [POEditor](https://poeditor.com/) project.
- **.czrc**: [Commitizen](https://commitizen-tools.github.io/commitizen/) configuration file, used to generate commit messages in compliancy with [Conventional Commits](https://conventionalcommits.org/).
- **.editorconfig**: [EditorConfig](http://editorconfig.org/) (code formatter) configuration file.
- **.eslintrc**: [ESLint](http://eslint.org/) (code linter) configuration file.
- **.gitattributes**: List of binary files (to prevent *diff*ing them).
- **.gitignore**: List of files to ignore.
- **.parcelrc**: [Parcel](https://v2.parceljs.org/recipes/web-extension/) configuration file for web extensions.
- **.prettierrc**: [Prettier](https://prettier.io/) (code formatter) configuration file.
- **.stylelintrc**: [Stylelint](https://stylelint.io/) (stylesheet formatter) configuration file.
- **.yarnrc.yml**: [Yarn](https://yarnpkg.com/) (package manager) configuration file.
- **CHANGELOG.md**: Changelog file, **do not edit manually**, use `yarn release`.
- **commitlint.config.cjs**: [Commitlint](https://commitlint.js.org/) configuration file, ensures [Conventional Commits](https://conventionalcommits.org/) compliancy.
- **cypress.json**: [Cypress](https://www.cypress.io/) (end-to-end testing) configuration file.
- **manifest.js**: Web extension manifest generator.
- **package.json**: Node.js package configuration file.
- **README.md**: Non-technical README file.
- **rollup.config.js**: [Rollup](https://rollupjs.org/) (bundler) configuration file.
- **svelte.config.js**: [Svelte](https://svelte.dev/) (front-end framework) configuration file.
- **TRANSLATE.md**: instructions for updating translations.
- **tsconfig.json**: [TypeScript](https://www.typescriptlang.org/) configuration file.
- **types.d.ts**: Custom type definitions.
- **yarn.lock**: [Yarn](https://yarnpkg.com/) lock file.

What is the difference between **assets/**, **src/assets/** and **static/**?

- **assets/**: Contains non-source assets, such as fonts, and images referenced by `manifest.json`.
- **src/assets/**: Contains source assets, such as stylesheets, and images referenced in the code.
- **static/**: Resources to be copied as is into the extension folder.

### Yarn scripts

- `yarn build`: Builds the extension. (There are other `build:...` commands, see below.)
- `yarn build-storybook`: Produces a self-contained Storybook, open it with `npx serve storybook-static`.
- `yarn check`: Runs ESLint, styllint and svelte-check.
- `yarn clean`: Removes the built extension.
- `yarn doc`: Builds the documentation.
- `yarn postinstall`: Installs git hooks. _(runs automatically.)_
- `yarn release`: Updates the version number and the changelog.
- `yarn start`: Runs the build in watch mode.
- `yarn storybook`: Runs the storybook in watch mode.
- `yarn test`: Runs the tests.

### Design principles

To ensure a certain degree of code quality, **the following design principles were followed**:

- **Functions must be easy to read and understand**: complex problems must be broken into simpler sub-problems. There are two linting rules to enforce this: [complexity](https://eslint.org/docs/rules/complexity) and [cognitive-complexity](https://github.com/SonarSource/eslint-plugin-sonarjs/blob/master/docs/rules/cognitive-complexity.md).
- The code must be **commented and well-commented**. Exported functions, classes and types must have [complete documentation](https://tsdoc.org/), local functions can be limited to a synthetic explanation. As a rule of thumb, good code is 60% code, 20% comments, 20% white lines (run `npx cloc src` to get the current numbers).
- A file should never be too long (200 lines is a sensible limit). The code should be split into multiple files, if needed, to make it easier to read and understand. Avoid circular dependencies. Type imports are not circular dependencies.
- The background script is the only script allowed to communicate with the network.
- **A function must have 0 or 1 type of side effect**, but as many side effects of the same type as needed. Side effects are: network interactions, DOM interactions, storage interactions, background interactions and background context modifications. Logging is not counted. Side effects of functions called are not counted. For instance, a function can send multiple network requests, but not save the results in local storage: it has to return the results to save.
- All commits on the _main_ branch must be passing tests.

### I18n (Internationalization)

The extension is fully translatable thanks to [svelte-i18n](https://github.com/kaisermann/svelte-i18n). See [TRANSLATE.md](./TRANSLATE.md) for instructions.

## Contributing

1. Install [Volta](https://volta.sh/): `curl https://get.volta.sh | bash`.
2. Clone the repository.
3. Install dependencies: `yarn install`.

### How to build

Run `yarn build`

### How to contribute

- Run in watch mode `yarn start`
- Run checks `yarn check`
- Run tests `yarn test` (not implemented yet)

Additional documentation:

- Read the API documentation with `yarn doc && npx serve docs`
  - Notable pages: `background/protocol` and `task`
- Read the storybook with `yarn storybook`

### How to debug

The extension use a debug module that have scope to debug specific part of the extension. To enable debug of the all extension run this command in the browser console

```js
localStorage.debug = '*'
```

To debug with a scope for example services you can run :

```js
localStorage.debug = 'service:*'
```

More information about this tool on their [README](https://github.com/visionmedia/debug#browser-support)

### Committing changes

Commits are linted with [commitlint](https://commitlint.js.org/), type `yarn cz` to write [conforming commit messages](https://www.conventionalcommits.org/en/v1.0.0/).

To release a new version, run `yarn release`, it will update the version number and the [changelog](./CHANGELOG.md) and create a new tag. The version number is updated according to [semver](https://semver.org/), based on the commits since the last release.

### Detailed build process

There are three different bundlers installed:

- [Rollup.js](https://rollupjs.org/guide/en/) is used to transform Svelte files to JavaScript. It cannot process HTML files and `manifest.json`, that's why there is also...
- [Parcel](https://v2.parceljs.org/) is used to produce a complete [web extension](https://v2.parceljs.org/recipes/web-extension/). It processes the manifest to find entrypoints. Svelte files are not yet supported by Parcel.
- [Webpack](https://webpack.js.org/) is used by [Storybook](https://storybook.js.org/).

Here is what happens when one runs `yarn build`:

[![`yarn build` diagram](https://mermaid.ink/img/eyJjb2RlIjoiZmxvd2NoYXJ0IExSXG5zdWJncmFwaCBFbGV2ZW50eVxuICAgIGRpcmVjdGlvbiBMUlxuICAgIC5uamsgLS0-IC5odG1sXG5lbmRcbnN1YmdyYXBoIFJvbGx1cFxuICAgIGRpcmVjdGlvbiBMUlxuICAgIC5zdmVsdGUgLS0-IC5qc1xuICAgIC5zdmVsdGUgLS0-IC5jc3NcbmVuZFxuc3ViZ3JhcGggUGFyY2VsXG4gICAgZGlyZWN0aW9uIExSXG4gICAgbWFuaWZlc3QuanNvbiA8LS0-IGFbXCIuaHRtbFwiXVxuICAgIGEgPC0tPiBiW1wiLmpzXCJdXG4gICAgYSA8LS0-IGNbXCIuY3NzXCJdXG5lbmRcbkVsZXZlbnR5IC0tPiBQYXJjZWxcblJvbGx1cCAtLT4gUGFyY2VsXG5QYXJjZWwgLS0-IGV4dGVuc2lvblxuIiwibWVybWFpZCI6eyJ0aGVtZSI6ImRlZmF1bHQifSwidXBkYXRlRWRpdG9yIjpmYWxzZSwiYXV0b1N5bmMiOnRydWUsInVwZGF0ZURpYWdyYW0iOmZhbHNlfQ)](https://mermaid-js.github.io/mermaid-live-editor/edit##eyJjb2RlIjoiZmxvd2NoYXJ0IExSXG5zdWJncmFwaCBFbGV2ZW50eVxuICAgIGRpcmVjdGlvbiBMUlxuICAgIC5uamsgLS0-IC5odG1sXG5lbmRcbnN1YmdyYXBoIFJvbGx1cFxuICAgIGRpcmVjdGlvbiBMUlxuICAgIC5zdmVsdGUgLS0-IC5qc1xuICAgIC5zdmVsdGUgLS0-IC5jc3NcbmVuZFxuc3ViZ3JhcGggUGFyY2VsXG4gICAgZGlyZWN0aW9uIExSXG4gICAgbWFuaWZlc3QuanNvbiA8LS0-IGFcbiAgICBhIDwtLT4gYltcIi5qc1wiXVxuICAgIGEgPC0tPiBjW1wiLmNzc1wiXVxuZW5kXG5FbGV2ZW50eSAtLT4gUGFyY2VsXG5Sb2xsdXAgLS0-IFBhcmNlbFxuUGFyY2VsIC0tPiBleHRlbnNpb25cbiIsIm1lcm1haWQiOiJ7XG4gIFwidGhlbWVcIjogXCJkZWZhdWx0XCJcbn0iLCJ1cGRhdGVFZGl0b3IiOmZhbHNlLCJhdXRvU3luYyI6dHJ1ZSwidXBkYXRlRGlhZ3JhbSI6ZmFsc2V9)

- `yarn build:eleventy-rollup` runs [Eleventy](https://11ty.dev/) and Rollup in parallel.
- `yarn build:static` produces the manifest and copies static files to the extension directory.
- `yarn build:parcel` makes Parcel process the manifest to produce the extension.

### Oddities

There are a few magic things going on in this repository:

- `$` resolves to `./src`, it is defined in `package.json` (for Parcel), `rollup.config.js` and `tsconfig.json`.
- `~` resolves to `.`, it is a default for Parcel, and also defined in `tsconfig.json`.
- Code is automatically tested and formatted before committing, thanks to [lint-staged](https://github.com/okonet/lint-staged#readme).
