const cp = require('child_process');
const os = require('os');
const path = require('path');

const fs = require('fs-extra');

const log = require('../src/utils/logger').child({ __filename });

module.exports.command = 'rebuild-framework-cache';
module.exports.desc = 'Rebuilds a cached Detox framework for the current environment in ~/Library/Detox. The cached framework is unique for each combination of Xcode and Detox version. (macOS only)';

module.exports.handler = async function buildFrameworkCache() {
  if (os.platform() === 'darwin') {
    const frameworkPath = path.join(os.homedir(), '/Library/Detox');
    log.info(`Removing framework binaries from ${frameworkPath}`);
    await fs.remove(frameworkPath);
    cp.execSync(path.join(__dirname, '../scripts/build_framework.ios.sh'), { stdio: 'inherit' });
  } else {
    log.info(`The command is supported only on macOS, skipping the execution.`);
  }
};
