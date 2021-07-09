module.exports = {
  env: {
    browser: true,
    node: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:unicorn/recommended',
    'plugin:sonarjs/recommended',
    'xo',
    'xo-typescript',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: ['svelte3', '@typescript-eslint', 'html'],
  rules: {
    complexity: ['error', 6],
    'unicorn/prevent-abbreviations': 'off',
    'unicorn/prefer-node-protocol': 'off',
    'unicorn/require-post-message-target-origin': 'off',
    'sonarjs/cognitive-complexity': ['error', 8],
  },
  overrides: [
    {
      files: ['*.svelte'],
      processor: 'svelte3/svelte3',
    },
  ],
  settings: {
    'svelte3/typescript': true,
    'svelte3/ignore-styles': () => true,
  },
}
