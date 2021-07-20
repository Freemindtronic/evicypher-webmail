# A new browser extension

## Try it!

1. Download the file `extension.zip` from the [latest successful build](https://github.com/Freemindtronic/browser-extension/actions?query=is%3Asuccess).
2. Load the extension using your browser developer tools.

## Architecture

[![](https://mermaid.ink/img/eyJjb2RlIjoiZmxvd2NoYXJ0IExSXG4gICAgc3ViZ3JhcGggUG9wdXBcbiAgICAgICAgcHMoW1wiUGhvbmUgc3RhdHVzZXNcIl0pXG4gICAgICAgIHAoW1wiUGFpcmluZ1wiXSlcbiAgICBlbmRcbiAgICBzdWJncmFwaCBDb250ZW50IFNjcmlwdHNcbiAgICAgICAgZShbXCJFbmNyeXB0aW9uXCJdKVxuICAgICAgICBkKFtcIkRlY3J5cHRpb25cIl0pXG4gICAgZW5kXG4gICAgc3ViZ3JhcGggQmFja2dyb3VuZFxuICAgICAgICBzdWJncmFwaCBTZXJ2aWNlc1xuICAgICAgICAgICAgeltcIlplcm9jb25mXCJdXG4gICAgICAgIGVuZFxuICAgICAgICBzdWJncmFwaCBUYXNrc1xuICAgICAgICAgICAgYnBbXCJQYWlyaW5nXCJdXG4gICAgICAgICAgICBiZVtcIkVuY3J5cHRpb25cIl1cbiAgICAgICAgICAgIGJkW1wiRGVjcnlwdGlvblwiXVxuICAgICAgICBlbmRcbiAgICBlbmRcbiAgICBwcyA8LS0-IHpcbiAgICBlIDwtLT4gYmVcbiAgICBkIDwtLT4gYmRcbiAgICBwIDwtLT4gYnBcbiIsIm1lcm1haWQiOnsidGhlbWUiOiJkZWZhdWx0In0sInVwZGF0ZUVkaXRvciI6ZmFsc2UsImF1dG9TeW5jIjp0cnVlLCJ1cGRhdGVEaWFncmFtIjpmYWxzZX0)](https://mermaid-js.github.io/mermaid-live-editor/edit##eyJjb2RlIjoiZmxvd2NoYXJ0IExSXG4gICAgc3ViZ3JhcGggUG9wdXBcbiAgICAgICAgcHMoW1wiUGhvbmUgc3RhdHVzZXNcIl0pXG4gICAgICAgIHAoW1wiUGFpcmluZ1wiXSlcbiAgICBlbmRcbiAgICBzdWJncmFwaCBDb250ZW50IFNjcmlwdHNcbiAgICAgICAgZShbXCJFbmNyeXB0aW9uXCJdKVxuICAgICAgICBkKFtcIkRlY3J5cHRpb25cIl0pXG4gICAgZW5kXG4gICAgc3ViZ3JhcGggQmFja2dyb3VuZFxuICAgICAgICBzdWJncmFwaCBTZXJ2aWNlc1xuICAgICAgICAgICAgeltcIlplcm9jb25mIFwiXVxuICAgICAgICBlbmRcbiAgICAgICAgc3ViZ3JhcGggVGFza3NcbiAgICAgICAgICAgIGJwW1wiUGFpcmluZ1wiXVxuICAgICAgICAgICAgYmVbXCJFbmNyeXB0aW9uXCJdXG4gICAgICAgICAgICBiZFtcIkRlY3J5cHRpb25cIl1cbiAgICAgICAgZW5kXG4gICAgZW5kXG4gICAgcHMgPC0tPiB6XG4gICAgZSA8LS0-IGJlXG4gICAgZCA8LS0-IGJkXG4gICAgcCA8LS0-IGJwXG4iLCJtZXJtYWlkIjoie1xuICBcInRoZW1lXCI6IFwiZGVmYXVsdFwiXG59IiwidXBkYXRlRWRpdG9yIjpmYWxzZSwiYXV0b1N5bmMiOnRydWUsInVwZGF0ZURpYWdyYW0iOmZhbHNlfQ)

**Legend:** [![](https://mermaid.ink/img/eyJjb2RlIjoiZmxvd2NoYXJ0IFREXG4gICAgcHMoW1wiVXNlciBpbnRlcmZhY2VcIl0pXG4gICAgYmRbXCJCYWNrZ3JvdW5kIGludGVyZmFjZVwiXVxuIiwibWVybWFpZCI6eyJ0aGVtZSI6ImRlZmF1bHQifSwidXBkYXRlRWRpdG9yIjpmYWxzZSwiYXV0b1N5bmMiOnRydWUsInVwZGF0ZURpYWdyYW0iOmZhbHNlfQ)](https://mermaid-js.github.io/mermaid-live-editor/edit/##eyJjb2RlIjoiZmxvd2NoYXJ0IFREXG4gICAgcHMoW1wiVXNlciBpbnRlcmZhY2VcIl0pXG4gICAgYmRbXCJCYWNrZ3JvdW5kIGludGVyZmFjXCJdXG4iLCJtZXJtYWlkIjoie1xuICBcInRoZW1lXCI6IFwiZGVmYXVsdFwiXG59IiwidXBkYXRlRWRpdG9yIjpmYWxzZSwiYXV0b1N5bmMiOnRydWUsInVwZGF0ZURpYWdyYW0iOmZhbHNlfQ)

Like most extensions, this extension is in three parts:

- A background script, [background/main.ts](./src/background/main.ts), that runs in the background and communicates with phones and other devices;
- A popup, [popup/Popup.svelte](./src/popup/Popup.svelte), that is displayed when the user clicks on the extension icon;
- Several content scripts, (only one at this time: [content-scripts/gmail.ts](./src/content-scripts/gmail.ts)), that are injected into the pages they target.

Both tasks and services are running in the background, but they are two different kinds of work:

- A _Task_ is a single unit of work started by the user. It may require some interaction with the user;
- A _Service_ is always running in the background, started when the extension starts. It must not require interaction with the user.

### Design principles

To ensure a certain degree of consistency, **the following design principles were followed**:

- **Functions must be easy to read and understand**: complex problems must be broken into simple sub-problems. There are two linting rules to enforce this: [complexity](https://eslint.org/docs/rules/complexity) and [cognitive-complexity](https://github.com/SonarSource/eslint-plugin-sonarjs/blob/master/docs/rules/cognitive-complexity.md);
- The code must be **commented and well-commented**. Exported functions, classes and types must have [complete documentation](https://tsdoc.org/), local functions can be limited to a synthetic explanation. As a rule of thumb, good code is 60% code, 20% comments, 20% white lines (run `npx cloc src` to get the current numbers);
- A file should never be too long (200 lines is a sensible limit). The code should be split into multiple files, if needed, to make it easier to read and understand. Avoid circular dependencies. Type imports are not circular dependencies;
- The background script is the only script allowed to communicate with the network;
- **A function must have 0 or 1 type of side effect**, but as many side effects of the same type as needed. Side effects are: network interactions, DOM interactions, storage interactions, background interactions and background context modifications. Logging is not counted. Side effects of functions called are not counted. For instance, a function can send multiple network requests, but not save the results in local storage: it has to return the results to save;
- All commits on the _main_ branch must be passing tests.

### Technologies

- Language: [TypeScript](https://www.typescriptlang.org/)
- Frontend framework: [Svelte](https://svelte.dev/)
- Frontend bundler: [rollup.js](https://rollupjs.org/)
- Linters: [ESLint](https://eslint.org/) and [svelte-check](https://github.com/sveltejs/language-tools/tree/master/packages/svelte-check)
- Formatter: [Prettier](https://prettier.io/)
- Package manager: [Yarn](https://yarnpkg.com/)
- End-to-end testing: [Cypress](https://www.cypress.io/) (to do)
- Design: [Sass](https://sass-lang.com/), linted with [Stylelint](https://stylelint.io/)

### I18n (Internationalization)

The extension is fully translatable thanks to [svelte-i18n](https://github.com/kaisermann/svelte-i18n).

## Contributing

1. Install [Volta](https://volta.sh/): `curl https://get.volta.sh | bash`;
2. Clone the repository;
3. Install dependencies: `yarn install`.

### How to build

Run `yarn build`

### How to contribute

- Run in watch mode `yarn start`
- Run checks `yarn check`
- Run tests `yarn test` (not implemented yet)
- Read the API documentation `yarn doc && cat docs/index.html`

**Note:** commits are linted with [commitlint](https://commitlint.js.org/), type `yarn cz` to write conforming commit messages.
