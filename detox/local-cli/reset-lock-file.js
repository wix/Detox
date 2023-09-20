const { log } = require('../internals');
const DeviceRegistry = require('../src/devices/allocation/DeviceRegistry');

module.exports.command = 'reset-lock-file';
module.exports.desc = 'Resets all Detox lock files. Useful when you need to clean up leftover locks from a crashed Detox instance.';

module.exports.handler = async function resetLockFile() {
  const registry = new DeviceRegistry();
  await registry.reset();

  log.info(`Cleaned lock file at: ${registry.lockFilePath}`);
};
