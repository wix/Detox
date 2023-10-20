/** @type {import('@jest/types').Config} */
module.exports = {
  coveragePathIgnorePatterns: [
    '__mocks__|__utils__|__tests__|node_modules',
    '.*\.test\..*',
  ],
  resetMocks: true,
  preset: 'ts-jest',
  testEnvironment: './test-environment.js',
  testMatch: [
    '<rootDir>/src/**/*.test.{js,ts}',
    '<rootDir>/src/__tests__/**/*.{js,ts}'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/__fixtures__/',
  ],
};
