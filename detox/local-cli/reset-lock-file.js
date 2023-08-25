const { log } = require('../internals');
const android = require('../src/servicelocator/android');
const ios = require('../src/servicelocator/ios');
const { getDetoxLibraryRootPath } = require('../src/utils/environment');

module.exports.command = 'reset-lock-file';
module.exports.desc = 'Resets all Detox lock files. Useful when you need to run multiple `detox test` commands in parallel with --keepLockFile.';

module.exports.handler = async function resetLockFile() {
  await Promise.all([
    ios.deviceRegistry.reset(),
    android.deviceRegistry.reset(),
  ]);

  log.info(`Cleaned lock files from: ${getDetoxLibraryRootPath()}`);
};
