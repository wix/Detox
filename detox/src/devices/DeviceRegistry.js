const fs = require('fs');
const plockfile = require('proper-lockfile');
const _ = require('lodash');
const retry = require('../utils/retry');
const {DEVICE_LOCK_FILE_PATH} = require('../utils/environment');
const LOCK_RETRY_OPTIONS = {retries: 100, interval: 5};

class DeviceRegistry {

  constructor({getDeviceIdsByType, createDevice}) {
    this.getDeviceIdsByType = getDeviceIdsByType;
    this.createDevice = createDevice;
    createEmptyLockFileIfNeeded();
  }

  async lock() {
    await retry(LOCK_RETRY_OPTIONS, () => plockfile.lockSync(DEVICE_LOCK_FILE_PATH));
  }

  async unlock() {
    await plockfile.unlockSync(DEVICE_LOCK_FILE_PATH);
  }

  async freeDevice(deviceId) {
    await this.lock();
    const lockedDevices = getLockedDevices();
    _.remove(lockedDevices, lockedDeviceId => lockedDeviceId === deviceId);
    writeLockedDevices(lockedDevices);
    await this.unlock();
  }

  async getDevice(deviceType) {
    await this.lock();
    const deviceIds = await this.getDeviceIdsByType(deviceType);

    let deviceId = getFirstUnlocked(deviceIds);
    if (!deviceId) {
      deviceId = await this.createDevice(deviceType);
    }

    const lockedDevices = getLockedDevices();
    lockedDevices.push(deviceId);
    writeLockedDevices(lockedDevices);
    await this.unlock();
    return deviceId;
  }
}

function createEmptyLockFileIfNeeded() {
  if (!fs.existsSync(DEVICE_LOCK_FILE_PATH)) {
    writeLockedDevices([]);
  }
}

function writeLockedDevices(lockedDevices) {
  fs.writeFileSync(DEVICE_LOCK_FILE_PATH, JSON.stringify(lockedDevices));
}

function getLockedDevices() {
  createEmptyLockFileIfNeeded();
  const lockFileContent = fs.readFileSync(DEVICE_LOCK_FILE_PATH, 'utf-8');
  return JSON.parse(lockFileContent);
}

function getFirstUnlocked(deviceIds) {
  console.log(`getFirstUnlocked ${deviceIds}`);
  for (let i = 0; i < deviceIds.length; i++) {
    let deviceId = deviceIds[i];
    if (!getLockedDevices().includes(deviceId)) {
      console.log(`getFirstUnlocked return ${deviceId}`);
      return deviceId;
    }
  }
}

module.exports = DeviceRegistry;
