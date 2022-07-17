module.exports = {
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  testEnvironment: 'detox/runners/jest/environment',
  testRunner: 'jest-circus/runner',
  testMatch: ['<rootDir>/*.test.js'],
  testTimeout: 120000,
  verbose: true,
};
