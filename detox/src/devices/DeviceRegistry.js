const fs = require('fs');
const plockfile = require('proper-lockfile');
const _ = require('lodash');
const retry = require('../utils/retry');
const {DETOX_LIBRARY_ROOT_PATH} = require('../utils/environment');
const LOCK_FILE = `${DETOX_LIBRARY_ROOT_PATH}/device.registry.state.lock`;
const LOCK_RETRY_OPTIONS = {retries: Number.MAX_SAFE_INTEGER, interval: 5};

class DeviceRegistry {

  constructor({getDeviceIdsByType, maxTestRunners = 1, createDevice}) {
    this.getDeviceIdsByType = getDeviceIdsByType;
    this.maxTestRunners = maxTestRunners;
    this.createDevice = createDevice;
    createEmptyLockFileIfNeeded();
  }

  async getDevice(deviceType) {
  await retry(LOCK_RETRY_OPTIONS, () => plockfile.lockSync(LOCK_FILE));
    const deviceIds = await this.getDeviceIdsByType(deviceType);
    await this._createDeviceIfNecessary({deviceIds, deviceType});

    const unlockedDeviceId = getFirstUnlocked(deviceIds);
    if (unlockedDeviceId) {
      const lockedDevices = getLockedDevices();
      lockedDevices.push(unlockedDeviceId);
      writeLockedDevices(lockedDevices);
      plockfile.unlockSync(LOCK_FILE);
      return unlockedDeviceId;
    }
    plockfile.unlockSync(LOCK_FILE);
    throw new Error(`Unable to find unlocked device ${deviceType}`);
  }

  static async freeDevice(deviceId) {
    await retry(LOCK_RETRY_OPTIONS, () => plockfile.lockSync(LOCK_FILE));
    const lockedDevices = getLockedDevices();
    _.remove(lockedDevices, lockedDeviceId => lockedDeviceId === deviceId);
    writeLockedDevices(lockedDevices);
    plockfile.unlockSync(LOCK_FILE);
  }

  async _createDeviceIfNecessary ({deviceIds, deviceType}) {
    const numberOfDevicesNeededToCreate = Math.max(this.maxTestRunners - deviceIds.length, 0);
    _.times(numberOfDevicesNeededToCreate, async () => await this.createDevice(deviceType));
  }

  static clear() {
    writeLockedDevices([]);
  }

}

function createEmptyLockFileIfNeeded() {
  if (!fs.existsSync(LOCK_FILE)) {
    writeLockedDevices([]);
  }
}

function writeLockedDevices(lockedDevices) {
  fs.writeFileSync(LOCK_FILE, JSON.stringify(lockedDevices));
}

function getLockedDevices() {
  createEmptyLockFileIfNeeded();
  const lockFileContent = fs.readFileSync(LOCK_FILE, 'utf-8');
  return JSON.parse(lockFileContent);
}

function getFirstUnlocked(deviceIds) {
  for (let i=0; i < deviceIds.length; i++) {
    let deviceId = deviceIds[i];
    if (!getLockedDevices().includes(deviceId)) {
      return deviceId;
    }
  }
}

module.exports = DeviceRegistry;