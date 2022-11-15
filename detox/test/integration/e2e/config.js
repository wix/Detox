module.exports = {
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  testEnvironment: 'detox/runners/jest/testEnvironment',
  testRunner: 'jest-circus/runner',
  reporters: [
    'detox/runners/jest/reporter',
    '<rootDir>/custom-reporter.js',
  ],
  testMatch: ['<rootDir>/*.test.js'],
  testTimeout: 120000,
  verbose: true,
};
