const path = require('path').posix;

const rootDir =  '../../..';
const dirname = './' + path.relative(path.join(__dirname, rootDir), __dirname);

module.exports = {
  ...require(`${rootDir}/test/e2e/jest.config.js`),

  rootDir,

  testEnvironment: `${dirname}/testEnvironment.js`,
  testMatch: ["**/detox-init-timeout/timeout.test.js"],
  testTimeout: 15000,
};
