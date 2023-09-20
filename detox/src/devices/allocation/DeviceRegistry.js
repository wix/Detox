const ExclusiveLockfile = require('../../utils/ExclusiveLockfile');
const PIDService = require('../../utils/PIDService');
const { getDeviceRegistryPath } = require('../../utils/environment');
const safeAsync = require('../../utils/safeAsync');

const DeviceList = require('./DeviceList');

const readOptions = {
  encoding: 'utf8',
};

class DeviceRegistry {
  constructor({
    lockfilePath = getDeviceRegistryPath(),
    sessionId = '',
    pidService = new PIDService(),
  } = {}) {
    /***
     * @private
     * @type {string}
     */
    this._lockfilePath = lockfilePath;
    /***
     * @private
     * @type {string}
     */
    this._sessionId = sessionId;
    /***
     * @private
     */
    this._pidService = pidService;
    /***
     * @protected
     * @type {ExclusiveLockfile}
     */
    this._lockfile = new ExclusiveLockfile(this._lockfilePath, {
      getInitialState: this._getInitialLockFileState.bind(this),
      readOptions,
    });
  }

  get lockFilePath() {
    return this._lockfilePath;
  }

  /**
   * Safety method to ensure that there are no remains of previously crashed Detox sessions.
   */
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
  async registerDevice(getDeviceId) {
    return this._lockfile.exclusively(async () => {
      const deviceId = await safeAsync(getDeviceId);
      if (deviceId) {
        this._upsertDevice(deviceId, {
          busy: true,
          sessionId: this._sessionId,
          pid: this._pidService.getPid(),
        });
      }
      return deviceId;
    });
  }

  /***
   * @param {string|Function} getDeviceId
   * @returns {Promise<string>}
   */
  async releaseDevice(getDeviceId) {
    return this._lockfile.exclusively(async () => {
      const deviceId = await safeAsync(getDeviceId);
      if (deviceId) {
        this._upsertDevice(deviceId, {
          busy: false,
          sessionId: this._sessionId,
          pid: this._pidService.getPid(),
        });
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

  async unregisterSessionDevices() {
    await this._lockfile.exclusively(async () => {
      const allDevices = this._getRegisteredDevices();
      const sessionDevices = allDevices.filter(device => device.sessionId === this._sessionId);
      for (const id of sessionDevices.getIds()) {
        allDevices.delete(id);
      }
      this._lockfile.write([...allDevices]);
    });
  }

  async unregisterZombieDevices() {
    await this._lockfile.exclusively(async () => {
      const allDevices = this._getRegisteredDevices();
      const zombieDevices = allDevices.filter(device => {
        return device.sessionId !== this._sessionId && !this._pidService.isAlive(device.pid);
      });

      for (const id of zombieDevices.getIds()) {
        allDevices.delete(id);
      }
      this._lockfile.write([...allDevices]);
    });
  }

  /**
   * @returns {Promise<DeviceList>}
   */
  async readSessionDevices() {
    let devices;
    await this._lockfile.exclusively(() => {
      devices = this._getSessionDevicesSync();
    });
    return devices;
  }

  getTakenDevicesSync() {
    const allDevices = this._getRegisteredDevices();
    const busyDevices = allDevices.filter(device => device.busy);
    const externalDevices = allDevices.filter(device => device.sessionId !== this._sessionId);
    return busyDevices.concat(externalDevices);
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

  _getSessionDevicesSync() {
    const devices = this._getRegisteredDevices();
    const sessionDevices = devices.filter(device => device.sessionId === this._sessionId);
    return sessionDevices;
  }
}

module.exports = DeviceRegistry;
