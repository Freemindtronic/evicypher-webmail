# EviCypher Webmail

Encrypt and decrypt emails directly from your web browser.

## Try it

1. Download the file `extension.zip` from the [latest successful build](https://github.com/Freemindtronic/evicypher-webmail/actions?query=is%3Asuccess).
2. Load the extension using your browser developer tools.

## Architecture

[![Architecture diagram](https://mermaid.ink/img/eyJjb2RlIjoiZmxvd2NoYXJ0IFREXG4gICAgc3ViZ3JhcGggUG9wdXBcbiAgICAgICAgcHMoW1wiUGhvbmUgc3RhdHVzZXNcIl0pXG4gICAgICAgIHAoW1wiUGFpcmluZ1wiXSlcbiAgICBlbmRcbiAgICBzdWJncmFwaCBDb250ZW50IFNjcmlwdHNcbiAgICAgICAgZShbXCJFbmNyeXB0aW9uXCJdKVxuICAgICAgICBkKFtcIkRlY3J5cHRpb25cIl0pXG4gICAgZW5kXG4gICAgc3ViZ3JhcGggRXZpRmlsZVxuICAgICAgICBlZShbXCJGaWxlIGVuY3J5cHRpb25cIl0pXG4gICAgICAgIGVkKFtcIkZpbGUgZGVjcnlwdGlvblwiXSlcbiAgICBlbmRcbiAgICBzdWJncmFwaCBCYWNrZ3JvdW5kXG4gICAgICAgIHN1YmdyYXBoIFNlcnZpY2VzXG4gICAgICAgICAgICB6W1wiWmVyb2NvbmYgXCJdXG4gICAgICAgIGVuZFxuICAgICAgICBzdWJncmFwaCBUYXNrc1xuICAgICAgICAgICAgYnBbXCJQYWlyaW5nXCJdXG4gICAgICAgICAgICBiZVtcIkVuY3J5cHRpb25cIl1cbiAgICAgICAgICAgIGJkW1wiRGVjcnlwdGlvblwiXVxuICAgICAgICAgICAgYmVlW1wiRmlsZSBFbmNyeXB0aW9uXCJdXG4gICAgICAgICAgICBiZWRbXCJGaWxlIGRlY3J5cHRpb25cIl1cbiAgICAgICAgZW5kXG4gICAgZW5kXG4gICAgcHMgPC0tPiB6XG4gICAgZSA8LS0-IGJlXG4gICAgZCA8LS0-IGJkXG4gICAgcCA8LS0-IGJwXG4gICAgZWUgPC0tPiBiZWVcbiAgICBlZCA8LS0-IGJlZFxuIiwibWVybWFpZCI6eyJ0aGVtZSI6ImRlZmF1bHQifSwidXBkYXRlRWRpdG9yIjpmYWxzZSwiYXV0b1N5bmMiOnRydWUsInVwZGF0ZURpYWdyYW0iOmZhbHNlfQ)](https://mermaid-js.github.io/mermaid-live-editor/edit/##eyJjb2RlIjoiZmxvd2NoYXJ0IFREXG4gICAgc3ViZ3JhcGggUG9wdXBcbiAgICAgICAgcHMoW1wiUGhvbmUgc3RhdHVzZXNcIl0pXG4gICAgICAgIHAoW1wiUGFpcmluZ1wiXSlcbiAgICBlbmRcbiAgICBzdWJncmFwaCBDb250ZW50IFNjcmlwdHNcbiAgICAgICAgZShbXCJFbmNyeXB0aW9uXCJdKVxuICAgICAgICBkKFtcIkRlY3J5cHRpb25cIl0pXG4gICAgZW5kXG4gICAgc3ViZ3JhcGggRXZpRmlsZVxuICAgICAgICBlZShbXCJGaWxlIGVuY3J5cHRpb25cIl0pXG4gICAgICAgIGVkKFtcIkZpbGUgZGVjcnlwdGlvblwiXSlcbiAgICBlbmRcbiAgICBzdWJncmFwaCBCYWNrZ3JvdW5kXG4gICAgICAgIHN1YmdyYXBoIFNlcnZpY2VzXG4gICAgICAgICAgICB6W1wiWmVyb2NvbmYgXCJdXG4gICAgICAgIGVuZFxuICAgICAgICBzdWJncmFwaCBUYXNrc1xuICAgICAgICAgICAgYnBbXCJQYWlyaW5nXCJdXG4gICAgICAgICAgICBiZVtcIkVuY3J5cHRpb25cIl1cbiAgICAgICAgICAgIGJkW1wiRGVjcnlwdGlvblwiXVxuICAgICAgICAgICAgYmVlW1wiRmlsZSBFbmNyeXB0aW9uXCJdXG4gICAgICAgICAgICBiZWRbXCJGaWxlIGRlY3J5cHRpb25cIl1cbiAgICAgICAgZW5kXG4gICAgZW5kXG4gICAgcHMgPC0tPiB6XG4gICAgZSA8LS0-IGJlXG4gICAgZCA8LS0-IGJkXG4gICAgcCA8LS0-IGJwXG4gICAgZWUgPC0tPiBiZWVcbiAgICBlZCA8LS0-IGJlZFxuIiwibWVybWFpZCI6IntcbiAgXCJ0aGVtZVwiOiBcImRlZmF1bHRcIlxufSIsInVwZGF0ZUVkaXRvciI6dHJ1ZSwiYXV0b1N5bmMiOnRydWUsInVwZGF0ZURpYWdyYW0iOmZhbHNlfQ)

**Legend:** [![Legend](https://mermaid.ink/img/eyJjb2RlIjoiZmxvd2NoYXJ0IFREXG4gICAgcHMoW1wiVXNlciBpbnRlcmZhY2VcIl0pXG4gICAgYmRbXCJCYWNrZ3JvdW5kIGludGVyZmFjZVwiXVxuIiwibWVybWFpZCI6eyJ0aGVtZSI6ImRlZmF1bHQifSwidXBkYXRlRWRpdG9yIjpmYWxzZSwiYXV0b1N5bmMiOnRydWUsInVwZGF0ZURpYWdyYW0iOmZhbHNlfQ)](https://mermaid-js.github.io/mermaid-live-editor/edit/##eyJjb2RlIjoiZmxvd2NoYXJ0IFREXG4gICAgcHMoW1wiVXNlciBpbnRlcmZhY2VcIl0pXG4gICAgYmRbXCJCYWNrZ3JvdW5kIGludGVyZmFjXCJdXG4iLCJtZXJtYWlkIjoie1xuICBcInRoZW1lXCI6IFwiZGVmYXVsdFwiXG59IiwidXBkYXRlRWRpdG9yIjpmYWxzZSwiYXV0b1N5bmMiOnRydWUsInVwZGF0ZURpYWdyYW0iOmZhbHNlfQ)

This extension is in four parts:

- A background script, [background/main.ts](./src/background/main.ts), that runs in the background and communicates with phones and other devices;
- A popup, [popup/Popup.svelte](./src/popup/Popup.svelte), that is displayed when the user clicks on the extension icon;
- Several content scripts, (only one at this time: [content-scripts/gmail.ts](./src/content-scripts/gmail.ts)), that are injected into the pages they target;
- Additional pages (only one at this time: [evifile/Evifile.svelte](./src/evifile/Evifile.svelte)), to provide common features.

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

<details>
  <summary>Intern's note</summary>

There is a folder named _legacy code_. The code there is of terrible quality and should be refactored. It contains a lot of code that was written for the previous extension, and it consists of poorly written cryptography and network code. Please dump the whole protocol and rewrite it from scratch, using **modern standards**.

</details>

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

### Committing changes

Commits are linted with [commitlint](https://commitlint.js.org/), type `yarn cz` to write [conforming commit messages](https://www.conventionalcommits.org/en/v1.0.0/).

To release a new version, run `yarn release`, it will update the [changelog](./CHANGELOG.md) and create a new tag with the version. The version number is updated according to [semver](https://semver.org/), based on the commits since the last release.
