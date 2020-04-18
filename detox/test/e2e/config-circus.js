const config = require('./config');

module.exports = {
  ...config,

  "setupFilesAfterEnv": ["./test/e2e/init.js"],
  "testEnvironment": "<rootDir>/runners/jest/environment",
  "testRunner": "./test/node_modules/jest-circus/runner",
};
