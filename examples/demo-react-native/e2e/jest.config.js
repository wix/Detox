/** @type {import('jest').Config} */
module.exports = {
  maxWorkers: 1,
  globalSetup: "./globalSetup.ts",
  globalTeardown: "detox/runners/jest/globalTeardown",
  testEnvironment: "detox/runners/jest/testEnvironment",
  setupFilesAfterEnv: ["./setup.ts"],
  testRunner: "jest-circus/runner",
  testTimeout: 120000,
  testMatch: ["**/*.test.ts"],
  transform: {
    "\\.tsx?$": "ts-jest"
  },
  reporters: ["detox/runners/jest/reporter"],
  verbose: true
};
