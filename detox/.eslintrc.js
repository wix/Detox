module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:import/recommended',
    'plugin:node/recommended',
    'plugin:ecmascript-compat/recommended',
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
