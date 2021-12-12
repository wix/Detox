const fs = require('fs-extra');
const _ = require('lodash');

const ExclusiveLockfile = require('../utils/ExclusiveLockfile');
const environment = require('../utils/environment');
const safeAsync = require('../utils/safeAsync');

const readOptions = {
  encoding: 'utf8',
};

const FIELD_NAME_ID = 'id';
const FIELD_NAME_DATA = 'data';

class DevicesList {
  constructor(devices) {
    this._devices = Object.freeze(devices);
  }

  /**
   * @returns {{id: string, data: *?}[]}
   */
  get rawDevices() {
    return this._devices;
  }

  /**
   * @param {string} deviceId
   * @returns {boolean}
   */
  includes(deviceId) {
    return DevicesList._includes(deviceId, this._devices);
  }

  static _includes(deviceId, devices) {
    return _.some(devices, [FIELD_NAME_ID, deviceId]);
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
   * @param {string|Function} getDeviceId
   * @param {*?} data
   * @returns {Promise<string>}
   */
  async allocateDevice(getDeviceId, data) {
    return this._lockfile.exclusively(async () => {
      const deviceId = await safeAsync(getDeviceId);
      this._registerDevice(deviceId, data);
      return deviceId;
    });
  }

  /***
   * @param {string|Function} getDeviceId
   * @returns {Promise<void>}
   */
  async disposeDevice(getDeviceId) {
    await this._lockfile.exclusively(async () => {
      const deviceId = await safeAsync(getDeviceId);
      if (deviceId) {
        this._unregisterDevice(deviceId);
      }
    });
  }

  /***
   * @param {string} deviceId
   * @returns {boolean}
   */
  includes(deviceId) {
    const devices = this._lockfile.read();
    return DevicesList._includes(deviceId, devices);
  }

  /***
   * @returns {DevicesList}
   */
  getRegisteredDevices() {
    const devices = this._lockfile.read();
    return new DevicesList(devices);
  }

  /***
   * @returns {DevicesList}
   */
  async readRegisteredDevices() {
    let result = null;
    await this._lockfile.exclusively(() => {
      result = this.getRegisteredDevices();
    });
    return result;
  }

  /***
   * @returns {DevicesList}
   */
  readRegisteredDevicesUNSAFE() {
    const contents = fs.readFileSync(this._lockfilePath, readOptions);
    const devices = JSON.parse(contents);
    return new DevicesList(devices);
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
  _registerDevice(deviceId, data) {
    const state = this._lockfile.read();
    let newState = _.reject(state, [FIELD_NAME_ID, deviceId]);

    const device = {};
    device[FIELD_NAME_ID] = deviceId;

    if (data) {
      device[FIELD_NAME_DATA] = data;
    }

    newState = _.concat(newState, device);
    this._lockfile.write(newState);
  }

  /**
   * @private
   */
  _unregisterDevice(deviceId) {
    const state = this._lockfile.read();
    const newState = _.reject(state, [FIELD_NAME_ID, deviceId]);
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
