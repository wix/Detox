/**
 * @typedef {import('../AllocationDriverBase').AllocationDriverBase} AllocationDriverBase
 * @typedef {import('../AllocationDriverBase').DeallocOptions} DeallocOptions
 * @typedef {import('../../../common/drivers/ios/cookies').IosSimulatorCookie} IosSimulatorCookie
 */

const _ = require('lodash');

const { DetoxRuntimeError } = require('../../../../errors');
const log = require('../../../../utils/logger').child({ cat: 'device,device-allocation' });

const SimulatorQuery = require('./SimulatorQuery');

/**
 * @implements {AllocationDriverBase}
 */
class SimulatorAllocDriver {
  /**
   * @param {object} options
   * @param {import('../../DeviceRegistry')} options.deviceRegistry
   * @param {DetoxInternals.RuntimeConfig} options.detoxConfig
   * @param {import('../../../common/drivers/ios/tools/AppleSimUtils')} options.applesimutils
   */
  constructor({ detoxConfig, deviceRegistry, applesimutils }) {
    this._deviceRegistry = deviceRegistry;
    this._applesimutils = applesimutils;
    this._launchInfo = {};
    this._shouldShutdown = detoxConfig.behavior.cleanup.shutdownDevice;
  }

  async init() {
    await this._deviceRegistry.unregisterZombieDevices();
  }

  /**
   * @param deviceConfig { Object }
   * @return {Promise<IosSimulatorCookie>}
   */
  async allocate(deviceConfig) {
    const deviceQuery = new SimulatorQuery(deviceConfig.device);

    const udid = await this._deviceRegistry.registerDevice(async () => {
      return await this._findOrCreateDevice(deviceQuery);
    });

    if (!udid) {
      throw new DetoxRuntimeError(`Failed to find device matching ${deviceQuery.getDeviceComment()}`);
    }

    this._launchInfo[udid] = { deviceConfig };
    return { id: udid, udid };
  }

  /**
   * @param {IosSimulatorCookie} deviceCookie
   * @returns {Promise<IosSimulatorCookie>}
   */
  async postAllocate(deviceCookie) {
    const { udid } = deviceCookie;
    const { deviceConfig } = this._launchInfo[udid];
    await this._applesimutils.boot(udid, deviceConfig.bootArgs, deviceConfig.headless);

    return {
      id: udid,
      udid,
      type: deviceConfig.type,
      bootArgs: deviceConfig.bootArgs,
      headless: deviceConfig.headless,
    };
  }

  /**
   * @param cookie { IosSimulatorCookie }
   * @param options { DeallocOptions }
   * @return {Promise<void>}
   */
  async free(cookie, options = {}) {
    const { udid } = cookie;

    if (options.shutdown) {
      await this._doShutdown(udid);
      await this._deviceRegistry.unregisterDevice(udid);
    } else {
      await this._deviceRegistry.releaseDevice(udid);
    }
  }

  async cleanup() {
    if (this._shouldShutdown) {
      const sessionDevices = await this._deviceRegistry.readSessionDevices();
      const shutdownPromises = sessionDevices.getIds().map((udid) => this._doShutdown(udid));
      await Promise.all(shutdownPromises);
    }

    await this._deviceRegistry.unregisterSessionDevices();
  }

  /**
   * @param {string} udid
   * @returns {Promise<void>}
   * @private
   */
  async _doShutdown(udid) {
    try {
      await this._applesimutils.shutdown(udid);
    } catch (err) {
      log.warn({ err }, `Failed to shutdown simulator ${udid}`);
    }
  }

  /***
   * @private
   * @param {SimulatorQuery} deviceQuery
   * @returns {Promise<String>}
   */
  async _findOrCreateDevice(deviceQuery) {
    let udid;

    const { free, taken } = await this._groupDevicesByStatus(deviceQuery);

    if (_.isEmpty(free)) {
      const prototypeDevice = taken[0];
      udid = this._applesimutils.create(prototypeDevice);
      await this._runScreenshotWorkaround(udid);
    } else {
      udid = free[0].udid;
    }

    return udid;
  }

  async _runScreenshotWorkaround(udid) {
    await this._applesimutils.takeScreenshot(udid, '/dev/null').catch(() => {
      log.debug({}, `
          NOTE: For an unknown yet reason, taking the first screenshot is apt
          to fail when booting iOS Simulator in a hidden window mode (or on CI).
          Detox applies a workaround by taking a dummy screenshot to ensure
          that the future ones are going to work fine. This screenshot is not
          saved anywhere, and the error above is suppressed for all log levels
          except for "debug" and "trace."
        `.trim());
    });
  }

  /**
   * @private
   * @param {SimulatorQuery} deviceQuery
   */
  async _groupDevicesByStatus(deviceQuery) {
    const searchResults = await this._queryDevices(deviceQuery);
    const takenDevices = this._deviceRegistry.getTakenDevicesSync();

    const { taken, free }  = _.groupBy(searchResults, ({ udid }) => {
      return takenDevices.includes(udid) ? 'taken' : 'free';
    });

    const targetOS = _.get(taken, '0.os.identifier');
    const isMatching = targetOS && { os: { identifier: targetOS } };

    return {
      taken: _.filter(taken, isMatching),
      free: _.filter(free, isMatching),
    };
  }

  /**
   * @private
   * @param {SimulatorQuery} deviceQuery
   */
  async _queryDevices(deviceQuery) {
    const result = await this._applesimutils.list(
      deviceQuery,
      `Searching for device ${deviceQuery} ...`
    );

    if (_.isEmpty(result)) {
      throw new DetoxRuntimeError({
        message: `Failed to find a device ${deviceQuery}`,
        hint: `Run 'applesimutils --list' to list your supported devices. ` +
          `It is advised only to specify a device type, e.g., "iPhone Xʀ" and avoid explicit search by OS version.`
      });
    }
    return result;
  }
}

module.exports = SimulatorAllocDriver;
