const path = require('path');
const { resolveConfig } = require('detox/internals');

const maxWorkersMap = {
  'android.emulator': 3,
  'android.genycloud': 5,
  'ios.simulator': 2,
};

module.exports = async () => {
  const config = await resolveConfig();

  const reporters = [
    '<rootDir>/runners/jest/reporter',
    ['jest-allure2-reporter', { getEnvironmentInfo: false }]
  ];

  if (process.env.DISABLE_JUNIT_REPORTER !== '1') {
    reporters.push('<rootDir>/test/node_modules/jest-junit');
  }

  return {
    'rootDir': path.join(__dirname, '../..'),
    'testEnvironment': './test/e2e/testEnvironment.js',
    'testRunner': './test/node_modules/jest-circus/runner',
    'testMatch': [
      '<rootDir>/test/e2e/**/*.test.{js,ts}',
      '<rootDir>/test/e2e-unhappy/**/*.test.{js,ts}',
    ],
    'setupFilesAfterEnv': ['./test/e2e/setup.js'],
    'globalSetup': '<rootDir>/runners/jest/globalSetup',
    'globalTeardown': '<rootDir>/runners/jest/globalTeardown',
    'testTimeout': 120000,
    'reporters': reporters,
    'verbose': true,
    'bail': false,
    'maxWorkers': process.env.CI ? maxWorkersMap[config.device.type] || 1 : 1,
    'collectCoverageFrom': [
      'src/**/*.js',
      '!**/__test/**',
      '!**/__mocks__/**',
      '!**/*.mock.js',
      '!**/*.test.js'
    ]
  };
};
