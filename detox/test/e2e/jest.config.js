module.exports = {
  rootDir: '..',
  testEnvironment: '@detox/runner-jest/testEnvironment',
  testMatch: [
    '<rootDir>/e2e/**/*.test.{js,ts}',
    '<rootDir>/e2e-unhappy/**/*.test.{js,ts}',
  ],
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
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
