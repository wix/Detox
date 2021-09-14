const _ = require('lodash');

const { AllocationDriverBase, DeallocationDriverBase } = require('../AllocationDriverBase');
const IosSimulatorCookie = require('../../../cookies/IosSimulatorCookie');

const DetoxRuntimeError = require('../../../../errors/DetoxRuntimeError');

class SimulatorAllocDriver extends AllocationDriverBase {
  /**
   * @param deviceRegistry { DeviceRegistry }
   * @param applesimutils { AppleSimUtils }
   * @param simulatorLauncher { SimulatorLauncher }
   */
  constructor({ deviceRegistry, applesimutils, simulatorLauncher }) {
    super();
    this._deviceRegistry = deviceRegistry;
    this._applesimutils = applesimutils;
    this._simulatorLauncher = simulatorLauncher;
  }

  /**
   * @param deviceQuery { Object | String }
   * @return {Promise<IosSimulatorCookie>}
   */
  async allocate(deviceQuery) {
    // TODO Delegate this onto a well tested allocator class
    const udid = await this._deviceRegistry.allocateDevice(async () => {
      return await this._findOrCreateDevice(deviceQuery);
    });

    const deviceComment = this._commentDevice(deviceQuery);
    if (!udid) {
      throw new DetoxRuntimeError(`Failed to find device matching ${deviceComment}`);
    }

    const type = (deviceQuery.type || deviceQuery);
    try {
      await this._simulatorLauncher.launch(udid, type);
    } catch (e) {
      await this._deviceRegistry.disposeDevice(udid);
      throw e;
    }

    return new IosSimulatorCookie(udid, type);
  }

  /***
   * @private
   * @param {String | Object} rawDeviceQuery
   * @returns {Promise<String>}
   */
  async _findOrCreateDevice(rawDeviceQuery) {
    let udid;

    const deviceQuery = this._adaptQuery(rawDeviceQuery);
    const { free, taken } = await this._groupDevicesByStatus(deviceQuery);

    if (_.isEmpty(free)) {
      const prototypeDevice = taken[0];
      udid = this._applesimutils.create(prototypeDevice);
    } else {
      udid = free[0].udid;
    }

    return udid;
  }

  async _groupDevicesByStatus(deviceQuery) {
    const searchResults = await this._queryDevices(deviceQuery);
    const { rawDevices: takenDevices } = this._deviceRegistry.getRegisteredDevices();
    const takenUDIDs = _.map(takenDevices, 'id');
    const { taken, free }  = _.groupBy(searchResults, ({ udid }) => takenUDIDs.includes(udid) ? 'taken' : 'free');

    const targetOS = _.get(taken, '0.os.identifier');
    const isMatching = targetOS && { os: { identifier: targetOS } };

    return {
      taken: _.filter(taken, isMatching),
      free: _.filter(free, isMatching),
    };
  }

  async _queryDevices(deviceQuery) {
    const result = await this._applesimutils.list(
      deviceQuery,
      `Searching for device ${this._commentQuery(deviceQuery)} ...`
    );

    if (_.isEmpty(result)) {
      throw new DetoxRuntimeError({
        message: `Failed to find a device ${this._commentQuery(deviceQuery)}`,
        hint: `Run 'applesimutils --list' to list your supported devices. ` +
          `It is advised only to specify a device type, e.g., "iPhone Xʀ" and avoid explicit search by OS version.`
      });
    }
    return result;
  }

  _adaptQuery(rawDeviceQuery) {
    let byId, byName, byOS, byType;

    if (_.isPlainObject(rawDeviceQuery)) {
      byId = rawDeviceQuery.id;
      byName = rawDeviceQuery.name;
      byOS = rawDeviceQuery.os;
      byType = rawDeviceQuery.type;
    } else {
      if (_.includes(rawDeviceQuery, ',')) {
        [byType, byOS] = _.split(rawDeviceQuery, /\s*,\s*/);
      } else {
        byType = rawDeviceQuery;
      }
    }

    return _.omitBy({
      byId,
      byName,
      byOS,
      byType,
    }, _.isUndefined);
  }

  _commentQuery({ byId, byName, byOS, byType }) {
    return _.compact([
      byId && `by UDID = ${JSON.stringify(byId)}`,
      byName && `by name = ${JSON.stringify(byName)}`,
      byType && `by type = ${JSON.stringify(byType)}`,
      byOS && `by OS = ${JSON.stringify(byOS)}`,
    ]).join(' and ');
  }

  _commentDevice(rawDeviceQuery) {
    return _.isPlainObject(rawDeviceQuery)
      ? JSON.stringify(rawDeviceQuery)
      : `(${rawDeviceQuery})`;
  }
}

class SimulatorDeallocDriver extends DeallocationDriverBase {
  constructor(udid, { deviceRegistry, simulatorLauncher }) {
    super();
    this.udid = udid;
    this._deviceRegistry = deviceRegistry;
    this._simulatorLauncher = simulatorLauncher;
  }

  /**
   * @param options { {shutdown: boolean} }
   * @return {Promise<void>}
   */
  async free(options = {}) {
    const { udid } = this;

    await this._deviceRegistry.disposeDevice(udid);

    if (options.shutdown) {
      await this._simulatorLauncher.shutdown(udid);
    }
  }
}

module.exports = {
  SimulatorAllocDriver,
  SimulatorDeallocDriver,
};
