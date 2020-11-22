const _ = require('lodash');
const environment = require('../utils/environment');
const ExclusiveLockfile = require('../utils/ExclusiveLockfile');
const safeAsync = require('../utils/safeAsync');

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
   * @param {string|Function} getDeviceId
   * @returns {Promise<string>}
   */
  async allocateDevice(getDeviceId) {
    return this._lockfile.exclusively(async () => {
      const deviceId = await safeAsync(getDeviceId);
      this._toggleDeviceStatus(deviceId, true);
      return deviceId;
    });
  }

  /***
   * @param {string|Function} getDeviceId
   * @returns {void}
   */
  async disposeDevice(getDeviceId) {
    await this._lockfile.exclusively(async () => {
      const deviceId = await safeAsync(getDeviceId);
      this._toggleDeviceStatus(deviceId, false);
    });
  }

  includes(deviceId) {
    return this._lockfile.read().includes(deviceId);
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
  _toggleDeviceStatus(deviceId, busy) {
    const state = this._lockfile.read();
    const newState = busy
      ? _.concat(state, deviceId)
      : _.without(state, deviceId);
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
