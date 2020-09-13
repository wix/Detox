const path = require('path').posix;

const rootDir =  '../../../..';
const dirname = './' + path.relative(path.join(__dirname, rootDir), __dirname);

module.exports = {
  ...require(`../../../e2e/config.js`),

  rootDir,

  setupFilesAfterEnv: [`${dirname}/init.js`],

  testRunner: 'jasmine2',
  testMatch: ["**/detox-init-timeout/timeout.test.js"],
  testEnvironment: 'node',
};
