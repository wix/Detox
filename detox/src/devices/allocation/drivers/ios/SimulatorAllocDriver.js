const _ = require('lodash');

const DetoxRuntimeError = require('../../../../errors/DetoxRuntimeError');
const IosSimulatorCookie = require('../../../cookies/IosSimulatorCookie');
const AllocationDriverBase = require('../AllocationDriverBase');

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
   * @param deviceConfig { Object }
   * @return {Promise<IosSimulatorCookie>}
   */
  async allocate(deviceConfig) {
    const deviceQuery = this._adaptQuery(deviceConfig.device);

    // TODO Delegate this onto a well tested allocator class
    const udid = await this._deviceRegistry.allocateDevice(async () => {
      return await this._findOrCreateDevice(deviceQuery);
    });

    const deviceComment = this._commentDevice(deviceQuery);
    if (!udid) {
      throw new DetoxRuntimeError(`Failed to find device matching ${deviceComment}`);
    }

    try {
      await this._simulatorLauncher.launch(udid, deviceConfig.type, deviceConfig.bootArgs);
    } catch (e) {
      await this._deviceRegistry.disposeDevice(udid);
      throw e;
    }

    return new IosSimulatorCookie(udid);
  }

  /**
   * @param cookie { IosSimulatorCookie }
   * @param options { DeallocOptions }
   * @return {Promise<void>}
   */
  async free(cookie, options = {}) {
    const { udid } = cookie;

    await this._deviceRegistry.disposeDevice(udid);

    if (options.shutdown) {
      await this._simulatorLauncher.shutdown(udid);
    }
  }

  /***
   * @private
   * @param deviceQuery {{
   *   byId?: string;
   *   byName?: string;
   *   byType?: string;
   *   byOS?: string;
   * }}
   * @returns {Promise<String>}
   */
  async _findOrCreateDevice(deviceQuery) {
    let udid;

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

  _adaptQuery({ id, name, os, type }) {
    return _.omitBy({
      byId: id,
      byName: name,
      byOS: os,
      byType: type,
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

  _commentDevice({ byId, byName, byOS, byType }) {
    return byId || _.compact([byName, byType, byOS]).join(', ');
  }
}

module.exports = SimulatorAllocDriver;
