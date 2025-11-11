/**
 * @typedef {import('../AllocationDriverBase').AllocationDriverBase} AllocationDriverBase
 * @typedef {import('../../../common/drivers/DeviceCookie').DeviceCookie} DeviceCookie
 */

const log = require('../../../../utils/logger').child({ __filename });
const sleep = require('../../../../utils/sleep');

const SystemUIDemoMode = require('./SystemUICfgHelper');

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
  }

  /**
   * @param {DeviceCookie & { adbName: string }} deviceCookie
   * @param {{ deviceConfig: Detox.DetoxSharedAndroidDriverConfig }} configs
   * @returns {Promise<DeviceCookie>}
   */
  async postAllocate(deviceCookie, configs) {
    const { deviceConfig } = configs;

    if (deviceConfig.systemUI) {
      await this._setupSystemUI(deviceCookie, deviceConfig);
    }
    return deviceCookie;
  }

  /**
   * @param {DeviceCookie & { adbName: string }} deviceCookie
   * @private
   */
  async _setupSystemUI(deviceCookie, deviceConfig) {
    const { adbName } = deviceCookie;
    const adbWrapper = {
      shell: async (cmd) => {
        await this._adb.shell(deviceCookie.adbName, cmd);
        await sleep(200);
      },
    };

    const systemUIDemoMode = new SystemUIDemoMode({ adb: adbWrapper });
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
