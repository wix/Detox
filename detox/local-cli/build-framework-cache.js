const cp = require('child_process');
const os = require('os');
const path = require('path');

const detox = require('../internals');

module.exports.command = 'build-framework-cache';
module.exports.desc = 'Builds a cached Detox framework for the current environment in ~/Library/Detox. The cached framework is unique for each combination of Xcode and Detox version. (macOS only)';

module.exports.handler = async function buildFrameworkCache() {
  if (os.platform() === 'darwin') {
    cp.execSync(path.join(__dirname, '../scripts/build_framework.ios.sh'), { stdio: 'inherit' });
  } else {
    detox.log.info(`The command is supported only on macOS, skipping the execution.`);
  }
};
