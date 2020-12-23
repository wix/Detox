const path = require('path').posix;

const rootDir =  '../../../..';
const dirname = './' + path.relative(path.join(__dirname, rootDir), __dirname);

module.exports = {
  ...require(`${rootDir}/test/e2e/config.js`),

  rootDir,

  testEnvironment: `${dirname}/environment.js`,
  testMatch: ["**/detox-init-timeout/timeout.test.js"],
};
