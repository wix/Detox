const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const log = require('../src/utils/logger').child({ __filename });

module.exports.command = 'clean-framework-cache';
module.exports.desc = "MacOS only. Delete all compiled framework binaries from ~/Library/Detox, they will be rebuilt on 'npm install' or when running 'build-framework-cache'";

module.exports.handler = async function cleanFrameworkCache() {
  if (os.platform() === 'darwin') {
    const frameworkPath = path.join(os.homedir(), '/Library/Detox');
    log.info(`Removing framework binaries from ${frameworkPath}`);
    await fs.remove(frameworkPath);
  } else {
    log.info(`The command is supported only on MacOS, skipping the execution.`);
  }
};
