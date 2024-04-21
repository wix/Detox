const os = require('os');
const path = require('path');

const fs = require('fs-extra');

const detox = require('../internals');

module.exports.command = 'clean-xcuitest-cache';
module.exports.desc = "Deletes all Detox cached XCUITest-runners from ~/Library/Detox. Cached framework can be rebuilt using the 'build-xcuitest-cache' command (MacOS only).";

module.exports.handler = async function cleanXCUITestCache() {
  if (os.platform() === 'darwin') {
    const frameworkPath = path.join(os.homedir(), '/Library/Detox/ios/xcuitest-runner');
    detox.log.info(`Removing XCUITest-runner binaries from ${frameworkPath}`);
    await fs.remove(frameworkPath);
  } else {
    detox.log.info(`The command is supported only on MacOS, skipping the execution.`);
  }
};
