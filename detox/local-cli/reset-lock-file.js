const { log } = require('../internals');
const DeviceRegistry = require('../src/devices/allocation/DeviceRegistry');

module.exports.command = 'reset-lock-file';
module.exports.desc = 'Resets Detox lock file completely - all devices are marked as available after that.';

module.exports.handler = async function resetLockFile() {
  const registry = new DeviceRegistry();
  await registry.reset();

  log.info(`Cleaned lock file at: ${registry.lockFilePath}`);
};
