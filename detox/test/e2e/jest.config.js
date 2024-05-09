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
    extends: require.resolve('detox-allure2-adapter/preset-allure'),
    overwrite: !process.env.CI,
    testCase: {
      labels: {
        package: ({ filePath }) => `${filePath.slice(1, -1).join('.')}.${_.kebabCase(filePath.at(-1))}`,
        testMethod: ({ testCase }) => testCase.fullName,
        tag: ['e2e', ...config.configurationName.split('.')],
      },
      links: {
        issue: 'https://github.com/wix/Detox/issues/{{name}}',
      },
    },
    environment: async ({ $ }) => ({
      'version.node': process.version,
      'version.jest': await $.manifest('jest', 'version'),
      'version.jest-metadata': await $.manifest('jest-metadata', 'version'),
      'version.allure-reporter': await $.manifest('jest-allure2-reporter', 'version'),
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
