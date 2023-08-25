// @ts-nocheck
const fs = require('fs-extra');

const ExclusiveLockfile = require('../../utils/ExclusiveLockfile');
const safeAsync = require('../../utils/safeAsync');

const DeviceList = require('./DeviceList');

const readOptions = {
  encoding: 'utf8',
};

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
   * @returns {DeviceListReadonly}
   */
  getRegisteredDevicesSync() {
    return this._getRegisteredDevices().filter(Boolean);
  }

  /***
   * @returns {DeviceListReadonly}
   */
  getBusyDevicesSync() {
    return this._getRegisteredDevices().filter(device => device.busy);
  }

  /***
   * @param {string|Function} getDeviceId
   * @param {*?} data
   * @returns {Promise<string>}
   */
  async registerDevice(getDeviceId) {
    return this._lockfile.exclusively(async () => {
      const deviceId = await safeAsync(getDeviceId);
      if (deviceId) {
        this._upsertDevice(deviceId, { busy: true });
      }
      return deviceId;
    });
  }

  /***
   * @param {string|Function} getDeviceId
   * @param {*?} data
   * @returns {Promise<string>}
   */
  async releaseDevice(getDeviceId) {
    return this._lockfile.exclusively(async () => {
      const deviceId = await safeAsync(getDeviceId);
      if (deviceId) {
        this._upsertDevice(deviceId, { busy: false });
      }
      return deviceId;
    });
  }

  /***
   * @param {string|Function} getDeviceId
   * @returns {Promise<void>}
   */
  async unregisterDevice(getDeviceId) {
    await this._lockfile.exclusively(async () => {
      const deviceId = await safeAsync(getDeviceId);
      if (deviceId) {
        this._deleteDevice(deviceId);
      }
    });
  }

  /***
   * @param {string} deviceId
   * @returns {boolean}
   */
  includes(deviceId) {
    const devices = this._lockfile.read();
    const devicesList = new DeviceList(devices);
    return devicesList.includes(deviceId);
  }

  /***
   * @returns {DeviceList}
   */
  async readRegisteredDevices() {
    let result = null;
    await this._lockfile.exclusively(() => {
      result = this._getRegisteredDevices();
    });
    return result;
  }

  /***
   * @returns {DeviceList}
   */
  readRegisteredDevicesUNSAFE() {
    const contents = fs.readFileSync(this._lockfilePath, readOptions);
    const devices = JSON.parse(contents);
    return new DeviceList(devices);
  }

  /***
   * @private
   */
  _getInitialLockFileState() {
    return [];
  }

  /**
   * @private
   */
  _upsertDevice(deviceId, data) {
    const devices = this._getRegisteredDevices();
    devices.add(deviceId, data);
    this._lockfile.write([...devices]);
  }

  /**
   * @private
   */
  _deleteDevice(deviceId) {
    const devices = this._getRegisteredDevices();
    devices.delete(deviceId);
    this._lockfile.write([...devices]);
  }

  /***
   * @private
   * @returns {DeviceList}
   */
  _getRegisteredDevices() {
    const devices = this._lockfile.read();
    return new DeviceList(devices);
  }
}

module.exports = DeviceRegistry;
