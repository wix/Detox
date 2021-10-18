module.exports = {
  'rootDir': '../..',
  'testEnvironment': './test/e2e/environment.js',
  'testRunner': './test/node_modules/jest-circus/runner',
  'setupFilesAfterEnv': ['./test/e2e/setup.js'],
  'globalSetup': './test/e2e/global-setup.js',
  'globalTeardown': './test/e2e/global-teardown.js',
  'testTimeout': 120000,
  'reporters': process.env.DISABLE_JUNIT_REPORTER === '1'
    ? ['<rootDir>/runners/jest/streamlineReporter']
    : ['<rootDir>/runners/jest/streamlineReporter', '<rootDir>/test/node_modules/jest-junit'],
  'verbose': true,
  'bail': false,
  'maxWorkers': Number(process.env.DEMO_MAX_WORKERS || '1'),
  'collectCoverageFrom': [
    'src/**/*.js',
    '!**/__test/**',
    '!**/__mocks__/**',
    '!**/*.mock.js',
    '!**/*.test.js'
  ]
};
