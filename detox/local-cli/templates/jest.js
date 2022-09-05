const firstTestContent = require('./firstTestContent');

const runnerConfig = `{
  "globalSetup": "detox/runners/jest/globalSetup",
  "globalTeardown": "detox/runners/jest/globalTeardown",
  "maxWorkers": 1,
  "reporters": ["detox/runners/jest/reporter"],
  "testEnvironment": "detox/runners/jest/testEnvironment",
  "testMatch": ["<rootDir>/e2e/**/*.test.js"],
  "testTimeout": 120000,
  "verbose": true
}
`;

exports.starter = firstTestContent;
exports.runnerConfig = runnerConfig;
