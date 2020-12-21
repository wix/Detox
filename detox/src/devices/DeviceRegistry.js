const _ = require('lodash');
const environment = require('../utils/environment');
const ExclusiveLockfile = require('../utils/ExclusiveLockfile');
const safeAsync = require('../utils/safeAsync');

const getDeviceEqualsFn = (deviceHandle) => (otherDeviceHandle) => _.isEqual(otherDeviceHandle, deviceHandle);
const getDeviceDifferFn = (deviceHandle) => (otherDeviceHandle) => !_.isEqual(otherDeviceHandle, deviceHandle);

class DeviceRegistry {
  constructor({ lockfilePath }) {
    /***
     * @protected
     * @type {ExclusiveLockfile}
     */
    this._lockfile = new ExclusiveLockfile(lockfilePath, {
      getInitialState: this._getInitialLockFileState.bind(this),
    });
  }

  async reset() {
    await this._lockfile.exclusively(() => {
      const empty = this._getInitialLockFileState();
      this._lockfile.write(empty);
    });
  }

  /***
   * @param {string|Function} getDeviceHandle
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
   * @param {string|Function} getDeviceHandle
   * @returns {void}
   */
  async disposeDevice(getDeviceHandle) {
    await this._lockfile.exclusively(async () => {
      const deviceId = await safeAsync(getDeviceHandle);
      this._toggleDeviceStatus(deviceId, false);
    });
  }

  includes(deviceHandle) {
    const deviceEqualsFn = getDeviceEqualsFn(deviceHandle);
    return !!_.find(this._lockfile.read(), deviceEqualsFn);
  }

  getRegisteredDevices() {
    return this._lockfile.read();
  }

  async readRegisteredDevices() {
    let result;
    await this._lockfile.exclusively(() => {
      result = this.getRegisteredDevices();
    })
    return result;
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
    const deviceDifferFn = getDeviceDifferFn(deviceHandle);
    const state = this._lockfile.read();
    const newState = busy
      ? _.concat(state, deviceHandle)
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

module.exports = DeviceRegistry;
