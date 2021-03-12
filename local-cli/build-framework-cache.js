const path = require('path');
const cp = require('child_process');
const os = require('os');
const log = require('../src/utils/logger').child({ __filename });

module.exports.command = 'build-framework-cache';
module.exports.desc = 'MacOS only. Build Detox.framework to ~/Library/Detox. The framework cache is specific for each combination of Xcode and Detox versions';

module.exports.handler = async function buildFrameworkCache() {
  if (os.platform() === 'darwin') {
    cp.execSync(path.join(__dirname, '../scripts/build_framework.ios.sh'), {stdio: 'inherit'});
  } else {
    log.info(`The command is supported only on MacOS, skipping the execution.`);
  }
};
