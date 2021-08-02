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
    'plugin:import/recommended',
    'plugin:import/typescript',
    'xo',
    'xo-typescript',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
    // To enable all rules in svelte files:
    // project: ['./tsconfig.json'],
    // extraFileExtensions: ['.svelte'],
    // This is not yet possible to enable some rules, see
    // https://github.com/sveltejs/eslint-plugin-svelte3/issues/89
  },
  plugins: ['svelte3', '@typescript-eslint', 'html'],
  rules: {
    camelcase: ['error', { properties: 'always' }],
    complexity: ['error', 6],
    'no-await-in-loop': 'off',
    'unicorn/prevent-abbreviations': 'off',
    'unicorn/prefer-node-protocol': 'off',
    'unicorn/require-post-message-target-origin': 'off',
    'sonarjs/cognitive-complexity': ['error', 8],
    'import/order': [
      'error',
      {
        groups: [
          'type',
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
        ],
        'newlines-between': 'never',
        alphabetize: { order: 'asc' },
      },
    ],
  },
  overrides: [
    {
      files: ['*.svelte'],
      processor: 'svelte3/svelte3',
    },
  ],
  settings: {
    'svelte3/typescript': true,
    // ESLint cannot process SCSS and Stylelint is setup, no need for these checks
    'svelte3/ignore-styles': () => true,
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts'],
    },
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
      },
    },
  },
  // Ignore config files
  ignorePatterns: ['*.config.js', '*.cjs'],
}
