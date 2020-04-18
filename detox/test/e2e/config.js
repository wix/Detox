module.exports = {
  "rootDir": "../..",
  "setupFilesAfterEnv": ["./test/e2e/init.js"],
  "testEnvironment": "<rootDir>/runners/jest/environment",
  "testRunner": "./test/node_modules/jest-circus/runner",
  "reporters": process.env.DISABLE_JUNIT_REPORTER === '1'
    ? ["<rootDir>/runners/jest/streamlineReporter"]
    : ["<rootDir>/runners/jest/streamlineReporter", "<rootDir>/test/node_modules/jest-junit"],
  "verbose": true,
  "bail": false,
  "collectCoverageFrom": [
    "src/**/*.js",
    "!**/__test/**",
    "!**/__mocks__/**",
    "!**/*.mock.js",
    "!**/*.test.js"
  ],
  "coverageDirectory": "test/coverage",
  "coverageReporters": [["lcov", {"projectRoot": "../.." }], "html"]
};
