process.env.CI = ''; // disable CI-specific behavior for integration tests

module.exports = {
  "maxWorkers": 1,
  "testMatch": ["<rootDir>/*.test.js"],
  "testTimeout": 120000,
  "verbose": true,
  "bail": false,
};
