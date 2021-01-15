const _ = require('lodash');
const environment = require('../utils/environment');
const fs = require('fs-extra');
const ExclusiveLockfile = require('../utils/ExclusiveLockfile');
const safeAsync = require('../utils/safeAsync');

const getDeviceEqualsFn = (deviceHandle) => (otherDeviceHandle) => _.isEqual(otherDeviceHandle, deviceHandle);
const getDeviceDifferFn = (deviceHandle) => (otherDeviceHandle) => !_.isEqual(otherDeviceHandle, deviceHandle);
const readOptions = {
  encoding: 'utf8',
};

class DeviceHandlesList {
  constructor(devices) {
    this.rawDevices = Object.freeze(devices);
  }

  includes(deviceHandle) {
    return DeviceHandlesList._includes(deviceHandle, this.rawDevices);
  }

  static _includes(deviceHandle, devices) {
    const rawDeviceHandle = getRawDeviceHandle(deviceHandle);
    const deviceEqualsFn = getDeviceEqualsFn(rawDeviceHandle);
    return !!_.find(devices, deviceEqualsFn);
  }
}

class DeviceRegistry {
  constructor({ lockfilePath }) {
    /***
     * @private
     * @type {string}
     */
    this._lockfilePath = lockfilePath;

    /***
     * @protected
     * @type {ExclusiveLockfile}
     */
    this._lockfile = new ExclusiveLockfile(lockfilePath, {
      getInitialState: this._getInitialLockFileState.bind(this),
      readOptions,
    });
  }

  async reset() {
    await this._lockfile.exclusively(() => {
      const empty = this._getInitialLockFileState();
      this._lockfile.write(empty);
    });
  }

  /***
   * @param {string|Object|Function} getDeviceHandle
   * @returns {Promise<string>}
   */
  async allocateDevice(getDeviceHandle) {
    return this._lockfile.exclusively(async () => {
      const deviceHandle = await safeAsync(getDeviceHandle);
      this._toggleDeviceStatus(deviceHandle, true);
      return deviceHandle;
    });
  }

  /***
   * @param {string|Object|Function} getDeviceHandle
   * @returns {void}
   */
  async disposeDevice(getDeviceHandle) {
    await this._lockfile.exclusively(async () => {
      const deviceId = await safeAsync(getDeviceHandle);
      if (deviceId) {
        this._toggleDeviceStatus(deviceId, false);
      }
    });
  }

  /***
   * @param {Object} deviceHandle
   * @returns {boolean}
   */
  includes(deviceHandle) {
    const devices = this._lockfile.read();
    return DeviceHandlesList._includes(deviceHandle, devices);
  }

  /***
   * @returns {DeviceHandlesList}
   */
  async readRegisteredDevices() {
    let result = null;
    await this._lockfile.exclusively(() => {
      result = new DeviceHandlesList(this._lockfile.read());
    })
    return result;
  }

  /***
   * @returns {DeviceHandlesList}
   */
  getRegisteredDevices() {
    const deviceHandles = this._lockfile.read();
    return new DeviceHandlesList(deviceHandles);
  }

  /***
   * @returns {DeviceHandlesList}
   */
  readRegisteredDevicesUNSAFE() {
    const contents = fs.readFileSync(this._lockfilePath, readOptions);
    const devices = JSON.parse(contents);
    return new DeviceHandlesList(devices);
  }

  /***
   * @private
   */
  _getInitialLockFileState() {
    return [];
  }

  /***
   * @private
   */
  _toggleDeviceStatus(deviceHandle, busy) {
    const rawDeviceHandle = getRawDeviceHandle(deviceHandle);
    const deviceDifferFn = getDeviceDifferFn(rawDeviceHandle);
    const state = this._lockfile.read();
    const newState = busy
      ? _.concat(state, rawDeviceHandle)
      : _.filter(state, deviceDifferFn);
    this._lockfile.write(newState);
  }

  static forIOS() {
    return new DeviceRegistry({
      lockfilePath: environment.getDeviceLockFilePathIOS(),
    });
  }

  static forAndroid() {
    return new DeviceRegistry({
      lockfilePath: environment.getDeviceLockFilePathAndroid(),
    });
  }
}

function getRawDeviceHandle(deviceHandle) {
  return JSON.parse(JSON.stringify(deviceHandle));
}

module.exports = DeviceRegistry;
