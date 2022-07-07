const { init, config, status } = require('detox/internals');

module.exports = async () => {
  if (status() === 'inactive') await init();

  return {
    'rootDir': '../..',
    'testEnvironment': './test/e2e/environment.js',
    'testRunner': './test/node_modules/jest-circus/runner',
    'testMatch': [
      '<rootDir>/test/e2e/**/*.test.{js,ts}'
    ],
    'setupFilesAfterEnv': ['./test/e2e/setup.js'],
    'globalSetup': './test/e2e/global-setup.js',
    'globalTeardown': './test/e2e/global-teardown.js',
    'testTimeout': 120000,
    'reporters': process.env.DISABLE_JUNIT_REPORTER === '1'
      ? ['<rootDir>/runners/jest/reporter']
      : ['<rootDir>/runners/jest/reporter', '<rootDir>/test/node_modules/jest-junit'],
    'verbose': true,
    'bail': false,
    'maxWorkers': process.env.CI ? (
      config.deviceConfig.type === 'android.genycloud' ? 3 : 2
    ) : 1,
    'collectCoverageFrom': [
      'src/**/*.js',
      '!**/__test/**',
      '!**/__mocks__/**',
      '!**/*.mock.js',
      '!**/*.test.js'
    ]
  };
};
