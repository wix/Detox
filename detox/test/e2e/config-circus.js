const config = require('./config');

module.exports = {
  ...config,

  "setupFilesAfterEnv": ["./test/e2e/init-circus.js"],
  "testEnvironment": "<rootDir>/runners/jest/JestCircusEnvironment",
  "testRunner": "./test/node_modules/jest-circus/runner",
};
