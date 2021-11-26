module.exports = {
  root: true,
  extends: [
    '@react-native-community',
    'plugin:unicorn/recommended'
  ],
  plugins: [
    'unicorn',
  ],
  rules: {
    'unicorn/expiring-todo-comments': ['warn',
      {
        allowWarningComments: false,
      }
    ],

    // disabled due to styling conflicts between eslint and prettier
    'prettier/prettier': 0,

    // TODO: enable this with argsIgnorePattern
    '@typescript-eslint/no-unused-vars': 0, // ['error', {argsIgnorePattern: '^_'}],

    // TODO: enable these rules gradually
    'comma-dangle': 0,
    'curly': 0,
    'eol-last': 0,
    'eqeqeq': 0,
    'jsx-quotes': 0,
    'keyword-spacing': 0,
    'no-extra-semi': 0,
    'no-sequences': 0,
    'no-trailing-spaces': 0,
    'no-useless-escape': 0,
    'quotes': 0,
    'react-native/no-inline-styles': 0,
    'react/no-did-mount-set-state': 0,
    'react/self-closing-comp': 0,
    'semi': 0,
    'semi-spacing': 0,
    'space-infix-ops': 0,
    'unicorn/catch-error-name': 0,
    'unicorn/consistent-function-scoping': 0,
    'unicorn/empty-brace-spaces': 0,
    'unicorn/filename-case': 0,
    'unicorn/no-array-callback-reference': 0,
    'unicorn/no-array-for-each': 0,
    'unicorn/no-null': 0,
    'unicorn/no-process-exit': 0,
    'unicorn/no-useless-undefined': 0,
    'unicorn/no-zero-fractions': 0,
    'unicorn/numeric-separators-style': 0,
    'unicorn/prefer-date-now': 0,
    'unicorn/prefer-export-from': 0,
    'unicorn/prefer-module': 0,
    'unicorn/prefer-number-properties': 0,
    'unicorn/prefer-optional-catch-binding': 0,
    'unicorn/prefer-regexp-test': 0,
    'unicorn/prefer-ternary': 0,
    'unicorn/prevent-abbreviations': 0,
  },
  overrides: [
    {
      files: ['*.js', '*.ts'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint/eslint-plugin'],
      rules: {
        'no-unused-vars': 'off',
        'no-undef': 'off',
        'jest/no-disabled-tests': 'warn',
      },
    },
  ],
};
