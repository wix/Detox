const { log } = require('../internals');
const DeviceRegistry = require('../src/devices/DeviceRegistry');
const { getDetoxLibraryRootPath } = require('../src/utils/environment');


module.exports.command = 'reset-lock-file';
module.exports.desc = 'Resets all Detox lock files. Useful when you need to run multiple `detox test` commands in parallel with --keepLockFile.';

module.exports.handler = async function resetLockFile() {
  await Promise.all([
    DeviceRegistry.forIOS().reset(),
    DeviceRegistry.forAndroid().reset(),
  ]);

  log.info(`Cleaned lock files from: ${getDetoxLibraryRootPath()}`);
};
