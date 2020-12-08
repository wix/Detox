const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const log = require('../src/utils/logger').child({ __filename });

module.exports.command = 'clean-framework-cache';
module.exports.desc = "Deletes all Detox cached frameworks from ~/Library/Detox. Cached framework can be rebuilt using the 'build-framework-cache' command. (macOS only)";

module.exports.handler = async function cleanFrameworkCache() {
  if (os.platform() === 'darwin') {
    const frameworkPath = path.join(os.homedir(), '/Library/Detox');
    log.info(`Removing framework binaries from ${frameworkPath}`);
    await fs.remove(frameworkPath);
  } else {
    log.info(`The command is supported only on MacOS, skipping the execution.`);
  }
};
