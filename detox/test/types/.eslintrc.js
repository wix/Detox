module.exports = {
  overrides: [
    {
      files: ['*.ts'],
      parserOptions: {
        project: ['./types/tsconfig.json']
      },
      rules: {
        'no-undef': 'off',
      },
    },
  ],
};
