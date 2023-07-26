module.exports = {
  rootDir: '..',
  testEnvironment: '<rootDir>/e2e/testEnvironment.js',
  testMatch: [
    '<rootDir>/e2e/**/*.test.{js,ts}'
  ],
  setupFilesAfterEnv: ['<rootDir>/e2e/setup.js'],
  globalSetup: '@detox/runner-jest/globalSetup',
  globalTeardown: '@detox/runner-jest/globalTeardown',
  testTimeout: 120000,
  reporters: [
    '@detox/runner-jest/reporter',
    ['jest-allure2-reporter', {
      getEnvironmentInfo: false,
      overwriteResultsDir: !process.env.CI,
    }]
  ],
  verbose: true,
  bail: false,
  maxWorkers: process.env.CI ? 2 : 1,
};
