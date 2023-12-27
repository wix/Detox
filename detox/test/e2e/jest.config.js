const path = require('path');
const _ = require('lodash');
const { resolveConfig } = require('detox/internals');

const maxWorkersMap = {
  'android.emulator': 3,
  'android.genycloud': 5,
  'ios.simulator': 2,
};


module.exports = async () => {
  const config = await resolveConfig();

  /** @type {import('jest-allure2-reporter').ReporterOptions} */
  const jestAllure2ReporterOptions = {
    overwrite: !process.env.CI,
    attachments: {
      fileHandler: 'copy',
    },
    testCase: {
      labels: {
        package: ({ filePath }) => filePath.slice(1).join('/'),
        testMethod: ({ testCase }) => testCase.fullName,
        tag: ['e2e', ...config.configurationName.split('.')],
      },
    },
    environment: () => ({
      'version.node': process.version,
      'version.jest': require('jest/package.json').version,
      ..._(process.env)
        .pickBy((_1, key) => key.match(/detox/i))
        .mapKeys((_1, key) => 'env.' + key)
        .value()
    }),
  };

  const reporters = [
    '<rootDir>/runners/jest/reporter',
    ['jest-allure2-reporter', jestAllure2ReporterOptions],
  ];

  if (process.env.DISABLE_JUNIT_REPORTER !== '1') {
    reporters.push('<rootDir>/test/node_modules/jest-junit');
  }

  return {
    'rootDir': path.join(__dirname, '../..'),
    'testEnvironment': './test/e2e/testEnvironment.js',
    'testEnvironmentOptions': {
      'eventListeners': [
        'jest-metadata/environment-listener',
        'jest-allure2-reporter/environment-listener',
        require.resolve('detox-allure2-adapter'),
      ]
    },
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
