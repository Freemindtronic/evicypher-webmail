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
    'plugin:no-unsanitized/DOM',
    'xo',
    'xo-typescript',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
    // To enable all rules in svelte files:
    extraFileExtensions: ['.svelte'],
  },
  plugins: ['svelte3', '@typescript-eslint', 'html'],
  rules: {
    camelcase: ['error', { properties: 'always' }],
    complexity: ['error', 6],
    curly: ['error', 'multi-or-nest', 'consistent'],
    'multiline-comment-style': ['error', 'separate-lines'],
    'no-await-in-loop': 'off',
    'unicorn/prevent-abbreviations': 'off',
    'unicorn/prefer-node-protocol': 'off',
    'unicorn/require-post-message-target-origin': 'off',
    'sonarjs/cognitive-complexity': ['error', 10],
    'import/order': [
      'error',
      {
        groups: [
          'type',
          'builtin',
          'external',
          'internal',
          'unknown',
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
      rules: {
        // Setting a variable to undefined is not the same thing as leaving the declaration empty
        'no-undef-init': 'off',
        'unicorn/no-useless-undefined': 'off',
        // This is not yet possible to enable some typed rules, see
        // https://github.com/sveltejs/eslint-plugin-svelte3/issues/89
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
      },
    },
    {
      files: ['*.js'],
      rules: { '@typescript-eslint/explicit-module-boundary-types': 'off' },
    },
    {
      files: ['*.{ts,svelte}'],
      rules: {
        '@typescript-eslint/naming-convention': [
          'error',
          {
            selector: 'variableLike',
            format: ['camelCase'],
            leadingUnderscore: 'allow',
          },
        ],
        '@typescript-eslint/naming-convention': [
          'error',
          {
            selector: 'parameter',
            format: null,
            types: ['function'],
            filter: {
              regex: '._',
              match: true,
            },
          },
        ],
      },
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
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        moduleDirectory: ['node_modules', 'src/'],
      },
    },
  },
  // Ignore config files
  ignorePatterns: ['*.config.js', '*.cjs'],
}
