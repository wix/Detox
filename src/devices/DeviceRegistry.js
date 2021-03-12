const _ = require('lodash');
const fs = require('fs-extra');
const plockfile = require('proper-lockfile');
const retry = require('../utils/retry');
const environment = require('../utils/environment');
const DEVICE_LOCK_FILE_PATH = environment.getDeviceLockFilePath();

const LOCK_RETRY_OPTIONS = {retries: 10000, interval: 5};

class DeviceRegistry {

  constructor({getDeviceIdsByType, createDevice}) {
    this.getDeviceIdsByType = getDeviceIdsByType;
    this.createDevice = createDevice;
    this._createEmptyLockFileIfNeeded();
  }

  async freeDevice(deviceId) {
    await this._lock();
    const lockedDevices = this._getBusyDevices();
    _.remove(lockedDevices, lockedDeviceId => lockedDeviceId === deviceId);
    this._writeBusyDevicesToLockFile(lockedDevices);
    await this._unlock();
  }

  async getDevice(deviceType) {
    await this._lock();

    let deviceId = await this._getFreeDevice(deviceType);
    if (!deviceId) {
      deviceId = await this.createDevice(deviceType);
    }

    const busyDevices = this._getBusyDevices();
    busyDevices.push(deviceId);
    this._writeBusyDevicesToLockFile(busyDevices);
    await this._unlock();
    return deviceId;
  }

  async _lock() {
    await retry(LOCK_RETRY_OPTIONS, () => plockfile.lockSync(DEVICE_LOCK_FILE_PATH));
  }

  async _unlock() {
    await plockfile.unlockSync(DEVICE_LOCK_FILE_PATH);
  }

  clear() {
    this._writeBusyDevicesToLockFile([]);
  }

  async isBusy(deviceId) {
    await this._lock();
    const isBusy = this._getBusyDevices().includes(deviceId);

    await this._unlock();
    return isBusy;
  }

  _createEmptyLockFileIfNeeded() {
    if (!fs.existsSync(DEVICE_LOCK_FILE_PATH)) {
      fs.ensureFileSync(DEVICE_LOCK_FILE_PATH);
      this._writeBusyDevicesToLockFile([]);
    }
  }

  _writeBusyDevicesToLockFile(lockedDevices) {
    fs.writeFileSync(DEVICE_LOCK_FILE_PATH, JSON.stringify(lockedDevices));
  }

  _getBusyDevices() {
    this._createEmptyLockFileIfNeeded();
    const lockFileContent = fs.readFileSync(DEVICE_LOCK_FILE_PATH, 'utf-8');
    return JSON.parse(lockFileContent);
  }

  async _getFreeDevice(deviceType) {
    const deviceIds = await this.getDeviceIdsByType(deviceType);

    for (let i = 0; i < deviceIds.length; i++) {
      let deviceId = deviceIds[i];
      if (!this._getBusyDevices().includes(deviceId)) {
        return deviceId;
      }
    }
  }
}

module.exports = DeviceRegistry;
