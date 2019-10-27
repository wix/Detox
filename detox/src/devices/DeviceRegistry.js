const _ = require('lodash');
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

  isDeviceBusy(deviceId) {
    return this._lockfile.read().includes(deviceId);
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
}

module.exports = DeviceRegistry;
