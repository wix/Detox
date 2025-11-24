/**
 * @typedef {import('../AllocationDriverBase').AllocationDriverBase} AllocationDriverBase
 * @typedef {import('../../../common/drivers/DeviceCookie').DeviceCookie} DeviceCookie
 */

const log = require('../../../../utils/logger').child({ __filename });
const sleep = require('../../../../utils/sleep');

const DeviceInitCache = require('./utils/DeviceInitCache');
const SystemUIDemoMode = require('./utils/SystemUICfgHelper');

/**
 * @abstract {AllocationDriverBase}
 */
class AndroidAllocDriver {
  /**
   * @param {object} options
   * @param {import('../../../common/drivers/android/exec/ADB')} options.adb
   */
  constructor({
    adb
  }) {
    this._adb = adb;
    this._systemUIInitCache = new DeviceInitCache();
  }

  /**
   * @param {DeviceCookie & { adbName: string }} deviceCookie
   * @param {{ deviceConfig: Detox.DetoxSharedAndroidDriverConfig }} configs
   * @returns {Promise<DeviceCookie>}
   */
  async postAllocate(deviceCookie, { deviceConfig }) {
    const { adbName } = deviceCookie;

    if (deviceConfig.systemUI) {
      if (this._systemUIInitCache.hasInitialized(adbName)) {
        log.debug(`Skipping System UI setup for ${adbName}, already initialized`);
      } else {
        await this._setupSystemUI(deviceCookie, deviceConfig);
        this._systemUIInitCache.setInitialized(adbName);
      }
    }
    return deviceCookie;
  }

  /**
   * @param {DeviceCookie & { adbName: string }} deviceCookie
   * @param {Detox.DetoxSharedAndroidDriverConfig} deviceConfig
   * @private
   */
  async _setupSystemUI(deviceCookie, deviceConfig) {
    const { adbName } = deviceCookie;
    
    const systemUIDemoMode = new SystemUIDemoMode({ adb: this._adb, adbName });
    const systemUIConfig = systemUIDemoMode.resolveConfig(deviceConfig.systemUI);

    log.debug(`Running keyboard behavior setup for ${adbName}`);
    await systemUIDemoMode.setupKeyboardBehavior(systemUIConfig);

    log.debug(`Running system UI setup for ${adbName}`);
    await systemUIDemoMode.setupPointerIndicators(systemUIConfig);
    await systemUIDemoMode.setupNavigationMode(systemUIConfig);
    await systemUIDemoMode.setupStatusBar(systemUIConfig);
    log.debug(`Finished system UI setup for ${adbName}`);
  }
}

module.exports = AndroidAllocDriver;
