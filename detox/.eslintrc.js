module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:import/recommended',
    'plugin:node/recommended',
    'plugin:unicorn/recommended'
  ],
  parser: '@typescript-eslint/parser',
  plugins: [
    'unicorn',
    'import',
    'node',
    '@typescript-eslint/eslint-plugin',
  ],
  env: {
    node: true
  },
  globals: {
    // TODO: remove use of fail() across the project because Jest Circus doesn't support it
    'fail': true
  },
  rules: {
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_' },
    ],
    'array-bracket-spacing': [
      'error',
      'never'
    ],
    'computed-property-spacing': [
      'error',
      'never'
    ],
    'import/order': [
      'error',
      {
        'alphabetize': {
          'order': 'asc'
        },
        'newlines-between': 'always'
      }
    ],
    'no-case-declarations': 'off',
    'no-debugger': 'error',
    'no-empty': 'off',
    'no-mixed-spaces-and-tabs': 'error',
    'no-multiple-empty-lines': [
      'error',
      {
        'max': 2,
        'maxBOF': 1
      }
    ],
    'no-prototype-builtins': 'off',
    'no-unused-vars': 'off',
    'node/no-unpublished-require': 'warn',
    'object-curly-spacing': [
      'error',
      'always'
    ],
    'semi': [
      'error',
      'always'
    ],
    'quotes': ['error', 'single', {
      'avoidEscape': true,
      'allowTemplateLiterals': true
    }],
    'unicorn/expiring-todo-comments': ['warn',
      {
        allowWarningComments: false,
      }
    ],
    // TODO: enable some of unicorn rules
    'unicorn/better-regex': 'off',
    'unicorn/catch-error-name': 'off',
    'unicorn/consistent-destructuring': 'off',
    'unicorn/consistent-function-scoping': 'off',
    'unicorn/empty-brace-spaces': 'off',
    'unicorn/error-message': 'off',
    'unicorn/explicit-length-check': 'off',
    'unicorn/filename-case': 'off',
    'unicorn/import-style': 'off',
    'unicorn/new-for-builtins': 'off',
    'unicorn/no-abusive-eslint-disable': 'off',
    'unicorn/no-array-callback-reference': 'off',
    'unicorn/no-array-for-each': 'off',
    'unicorn/no-array-reduce': 'off',
    'unicorn/no-await-expression-member': 'off',
    'unicorn/no-lonely-if': 'off',
    'unicorn/no-nested-ternary': 'off',
    'unicorn/no-new-array': 'off',
    'unicorn/no-null': 'off',
    'unicorn/no-object-as-default-parameter': 'off',
    'unicorn/no-useless-undefined': 'off',
    'unicorn/number-literal-case': 'off',
    'unicorn/numeric-separators-style': 'off',
    'unicorn/prefer-add-event-listener': 'off',
    'unicorn/prefer-array-some': 'off',
    'unicorn/prefer-array-flat': 'off',
    'unicorn/prefer-includes': 'off',
    'unicorn/prefer-module': 'off',
    'unicorn/prefer-number-properties': 'off',
    'unicorn/prefer-object-from-entries': 'off',
    'unicorn/prefer-optional-catch-binding': 'off',
    'unicorn/prefer-regexp-test': 'off',
    'unicorn/prefer-spread': 'off',
    'unicorn/prefer-string-slice': 'off',
    'unicorn/prefer-string-starts-ends-with': 'off',
    'unicorn/prefer-string-trim-start-end': 'off',
    'unicorn/prefer-ternary': 'off',
    'unicorn/prevent-abbreviations': 'off',
  },

  overrides: [
    {
      files: ['*.test.{js,ts}', '**/{__mocks__,__tests__}/*.{js, ts}'],
      plugins: [
        'no-only-tests',
      ],
      env: {
        jest: true
      },
      rules: {
        'no-only-tests/no-only-tests': 'error',
      }
    }
  ]
};
