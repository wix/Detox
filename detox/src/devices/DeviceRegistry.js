const fs = require('fs');
const plockfile = require('proper-lockfile');
const _ = require('lodash');
const retry = require('../utils/retry');
const LOCK_FILE = './device.registry.state.lock';

class DeviceRegistry {

  constructor({getDeviceIdsByType, maxTestRunners = 1, createDevice = () => {}}) {
    this.getDeviceIdsByType = getDeviceIdsByType;
    this.maxTestRunners = maxTestRunners;
    this.createDevice = createDevice;
    createEmptyLockFileIfNeeded();
  }

  async getDevice(deviceType) {
    await retry(() => plockfile.lockSync(LOCK_FILE));
    const deviceIds = await this.getDeviceIdsByType(deviceType);
    await this._createDeviceIfNecessary({deviceIds});

    const unlockedDeviceId = getFirstUnlocked(deviceIds);
    if (unlockedDeviceId) {
      const lockedDevices = getLockedDevices();
      lockedDevices.push(unlockedDeviceId);
      writeLockedDevices(lockedDevices);
      plockfile.unlockSync(LOCK_FILE);
      return unlockedDeviceId;
    }
    plockfile.unlockSync(LOCK_FILE);
  }

  async _createDeviceIfNecessary ({deviceIds}) {
    const numberOfDevicesNeededToCreate = Math.max(this.maxTestRunners - deviceIds.length, 0);
    _.times(numberOfDevicesNeededToCreate, async () => await this.createDevice());
  }

  static clear() {
    writeLockedDevices([]);
  }

}

const createEmptyLockFileIfNeeded = () => {
  if (!fs.existsSync(LOCK_FILE)) {
    writeLockedDevices([]);
  }
};

const writeLockedDevices = lockedDevices => fs.writeFileSync(LOCK_FILE, JSON.stringify(lockedDevices));

const getLockedDevices = () => {
  createEmptyLockFileIfNeeded();
  const lockFileContent = fs.readFileSync(LOCK_FILE, 'utf-8');
  return JSON.parse(lockFileContent);
};

const getFirstUnlocked = deviceIds => {
  for (let i=0; i < deviceIds.length; i++) {
    let deviceId = deviceIds[i];
    if (!getLockedDevices().includes(deviceId)) {
      return deviceId;
    }
  }
};

DeviceRegistry.clear();
module.exports = DeviceRegistry;