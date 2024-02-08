const cp = require('child_process');
const os = require('os');
const path = require('path');

const detox = require('../internals');

module.exports.command = 'build-xcuitest-cache';
module.exports.desc = 'Builds a cached Detox XCUITest-runner for the current environment in ~/Library/Detox. The cached framework is unique for each combination of Xcode and Detox version (MacOS only).';

module.exports.handler = async function buildXCUITestCache() {
  if (os.platform() === 'darwin') {
    cp.execSync(path.join(__dirname, '../scripts/build_local_xcuitest.ios.sh'), { stdio: 'inherit' });
  } else {
    detox.log.info(`The command is supported only on MacOS, skipping the execution.`);
  }
};
