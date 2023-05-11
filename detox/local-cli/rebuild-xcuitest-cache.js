const cp = require('child_process');
const os = require('os');
const path = require('path');

const fs = require('fs-extra');

const log = require('../src/utils/logger').child({ cat: 'cli' });

module.exports.command = 'rebuild-xcuitest-cache';
module.exports.desc = 'Rebuilds a cached Detox XCUITest-runner for the current environment in ~/Library/Detox. The cached runner is unique for each combination of Xcode and Detox version (MacOS only).';

module.exports.handler = async function rebuildXCUITestCache() {
  if (os.platform() === 'darwin') {
    const frameworkPath = path.join(os.homedir(), '/Library/Detox/ios/xcuitest-runner');
    log.info(`Removing runner binaries from ${frameworkPath}`);
    await fs.remove(frameworkPath);
    cp.execSync(path.join(__dirname, '../scripts/build_local_xcuitest.ios.sh'), { stdio: 'inherit' });
  } else {
    log.info(`The command is supported only on MacOS, skipping the execution.`);
  }
};
