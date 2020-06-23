module.exports = {
  ...require('./config'),

  setupFilesAfterEnv: ["./test/e2e/init-jasmine.js"],
  testRunner: 'jasmine2',
  testEnvironment: 'node',
};
