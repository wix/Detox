const _ = require('lodash');
const { ensureSuffix } = require('../../utils/string');
const log = require('../../utils/logger').child({ __filename });
const DeviceRegistryLock = require('./DeviceRegistryLock');

/***
 * @abstract
 */
class DeviceRegistry {
  constructor({
    deviceRegistryLock = new DeviceRegistryLock(),
  }) {
    this._deviceRegistryLock = deviceRegistryLock;
  }

  // istanbul ignore next
  /***
   * @abstract
   * @protected
   */
  async createDeviceWithProperties(deviceProperties) {}

  // istanbul ignore next
  /***
   * @abstract
   * @protected
   */
  async getDevicesWithProperties(deviceProperties) {}

  // istanbul ignore next
  /***
   * @abstract
   * @protected
   */
  getRuntimeVersion(deviceProperties) {}

  async acquireDevice(deviceProperties) {
    log.trace({ event: 'ACQUIRING_DEVICE' }, 'acquiring device with properties', deviceProperties);
    await this._deviceRegistryLock.lock();

    try {
      const exactMatch = await this._findExactDevice(deviceProperties);
      const similarMatch = exactMatch.available ? exactMatch : await this._findSimilarDevice(exactMatch.latest);
      const device = similarMatch.available || await this._createSimilarDevice(exactMatch.latest);

      this._deviceRegistryLock.busyDevices.add(device.udid);
      return device.udid;
    } finally {
      await this._deviceRegistryLock.unlock();
    }
  }

  async freeDevice(deviceId) {
    await this._deviceRegistryLock.lock();

    try {
      this._deviceRegistryLock.busyDevices.delete(deviceId);
    } finally {
      await this._deviceRegistryLock.unlock();
    }
  }

  async _findExactDevice(deviceProperties) {
    const match = await this._findDeviceByQuery(deviceProperties);

    if (match.available) {
      const { name, udid } = match.available;
      log.trace({ event: 'EXACT_DEVICE_ACQUIRED' }, `device with name="${name}" and udid="${udid}" is acquired.`);
    }

    return match;
  }

  async _findSimilarDevice(deviceProperties) {
    if (!deviceProperties) {
      throw new Error('Cannot search for similar device when there is no query to start with.');
    }

    const nonSpecificPropertiesOfDevice = _.omit(deviceProperties, ['udid', 'name']);
    const match = await this._findDeviceByQuery(nonSpecificPropertiesOfDevice);

    if (match.available) {
      const { udid } = match.available;
      const { name } = deviceProperties;
      log.trace({ event: 'SIMILAR_DEVICE_ACQUIRED' }, `similar device to "${name}" with udid="${udid}" is acquired.`);
    }

    return match;
  }

  async _createSimilarDevice(deviceProperties) {
    const deviceName = deviceProperties.name;
    const newDeviceProperties = {
      ..._.omit(deviceProperties, ['udid']),
      name: ensureSuffix(deviceName, '-Detox')
    };

    log.debug({ event: 'CREATING_SIMILAR_DEVICE' },
      `creating device similar to ${deviceName} with properties:`, newDeviceProperties);

    const newUDID = await this.createDeviceWithProperties(newDeviceProperties);

    return {
      ...newDeviceProperties,
      udid: newUDID
    };
  }

  async _findDeviceByQuery(searchQuery) {
    const allResults = await this.getDevicesWithProperties(searchQuery);
    const latestVersion = _(allResults).map(this.getRuntimeVersion).max();
    const withLatestVersion = _.filter(allResults, (device) => {
      return this.getRuntimeVersion(device) === latestVersion;
    });

    return {
      available: withLatestVersion.find(this._isDeviceAvailable, this),
      latest: withLatestVersion[0],
    };
  }

  _isDeviceAvailable({ udid }) {
    const busy = this._deviceRegistryLock.busyDevices.has(udid);

    return !busy;
  }
}

module.exports = DeviceRegistry;
