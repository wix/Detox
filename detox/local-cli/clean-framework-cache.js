const fs = require('fs-extra');
const path = require('path');
const os = require('os');


module.exports.command = 'clean-framework-cache'
module.exports.desc = "Delete all compiled framework binaries from ~/Library/Detox, they will be rebuilt on 'npm install' or when running 'build-framework-cache'"

module.exports.handler = async function run() {
  if (os.platform() === 'darwin') {
    const frameworkPath = path.join(os.homedir(), '/Library/Detox');
    console.log(`Removing framework binaries from ${frameworkPath}`);
    await fs.remove(frameworkPath);
  }
}
