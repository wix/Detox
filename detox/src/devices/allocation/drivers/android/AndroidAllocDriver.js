/**
 * @typedef {import('../AllocationDriverBase').AllocationDriverBase} AllocationDriverBase
 * @typedef {import('../../../common/drivers/DeviceCookie').DeviceCookie} DeviceCookie
 */

const _ = require('lodash');

const log = require('../../../../utils/logger').child({ __filename });
const sleep = require('../../../../utils/sleep');

/**
 * @type Detox.DetoxSystemUIConfig
 */
const minimalSystemUIConfig = {
  keyboard: 'hide',
  touches: 'show',
  navigationMode: '3-button',
  statusBar: {
    notifications: 'hide',
    wifiSignal: 'strong',
    cellSignal: 'none',
    batteryLevel: 'full',
    charging: true,
    clock: '1337',
  },
};

const batteryPercent = {
  full: 100,
  half: 50,
  low: 20,
};

const navigationModesDictionary = {
  '3-button': 'com.android.internal.systemui.navbar.threebutton',
//      '2-button': 'com.android.internal.systemui.navbar.twobutton',
  'gesture': 'com.android.internal.systemui.navbar.gestural',
};

/**
 *
 * @param {any | undefined | null} value
 * @param {(value: any) => any | undefined} fn
 * @returns {any | undefined}
 */
const nullishOrMap = (value, fn) => (value === undefined || value === null) ? undefined : fn(value);

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
   * @param {DeviceCookie} deviceCookie
   * @param {{ deviceConfig: Detox.DetoxSharedAndroidDriverConfig }} configs
   * @returns {Promise<DeviceCookie>}
   */
  async postAllocate(deviceCookie, configs) {
    const { deviceConfig } = configs;

    if (!deviceConfig.systemUI) {
      return;
    }

    /** @type Detox.DetoxSystemUIConfig */
    let systemUIConfig;
    if (deviceConfig.systemUI === 'minimal') {
      systemUIConfig = minimalSystemUIConfig;
    } else if (_.isObject(deviceConfig.systemUI) && deviceConfig.systemUI.extends === 'minimal') {
      systemUIConfig = _.merge({}, minimalSystemUIConfig, deviceConfig.systemUI);
    } else {
      systemUIConfig = deviceConfig.systemUI;
    }
    await this._initDemoMode(deviceCookie, systemUIConfig);

    return deviceCookie;
  }

  /**
   * @param deviceCookie
   * @param {Detox.DetoxSystemUIConfig} systemUIConfig
   */
  async _initDemoMode(deviceCookie, systemUIConfig) {
    const { adbName } = deviceCookie;
    const adb = {
      shell: async (cmd) => {
        await this._adb.shell(deviceCookie.adbName, cmd);
        await sleep(200);
      },
    };

    log.debug(`Running keyboard behavior setup for ${adbName}`);
    await this._setupKeyboardBehavior(adb, systemUIConfig);

    log.debug(`Running system UI setup for ${adbName}`);
    await this._setupPointerIndicators(adb, systemUIConfig);
    await this._setupNavigationMode(adb, systemUIConfig);
    await this._setupStatusBar(adb, systemUIConfig);
    log.debug(`Finished system UI setup for ${adbName}`);
  }

  /**
   * @param {object} adb
   * @param {Detox.DetoxSystemUIConfig} systemUIConfig
   */
  async _setupKeyboardBehavior(adb, systemUIConfig) {
    const showKbd = nullishOrMap(systemUIConfig.keyboard, (keyboard) => Number(keyboard === 'show'));

    if (showKbd !== undefined) {
      await adb.shell(`settings put Secure show_ime_with_hard_keyboard ${showKbd}`);
    }
  }

  /**
   * @param {object} adb
   * @param {Detox.DetoxSystemUIConfig} systemUIConfig
   */
  async _setupPointerIndicators(adb, systemUIConfig) {
    const showTouches = nullishOrMap(systemUIConfig.touches, (touches) => Number(touches === 'show'));
    if (showTouches !== undefined) {
      await adb.shell(`settings put system show_touches ${showTouches}`);
    }

    const showPointerLocationBar = nullishOrMap(systemUIConfig.pointerLocationBar, (pointerLocationBar) => Number(pointerLocationBar === 'show'));
    if (showPointerLocationBar !== undefined) {
      await adb.shell(`settings put system pointer_location 1`);
    }
  }

  /**
   * @param {object} adb
   * @param {Detox.DetoxSystemUIConfig} systemUIConfig
   */
  async _setupNavigationMode(adb, systemUIConfig) {
    const navigationMode = nullishOrMap(systemUIConfig.navigationMode, (navigationMode) => navigationModesDictionary[navigationMode]);
    if (navigationMode !== undefined) {
      await adb.shell(`cmd overlay enable ${navigationMode}`);
    }
  }

  /**
   * Ref: https://android.googlesource.com/platform/frameworks/base/+/master/packages/SystemUI/docs/demo_mode.md
   *
   * @param {object} adb
   * @param {Detox.DetoxSystemUIConfig} systemUIConfig
   */
  async _setupStatusBar(adb, systemUIConfig) {
    const { statusBar: statusBarConfig } = systemUIConfig;
    if (_.isUndefined(statusBarConfig)) {
      return;
    }

    // Enable, then get out (= reset status-bar) and back into demo mode
    await adb.shell('settings put global sysui_demo_allowed 1');
    await adb.shell('am broadcast -a com.android.systemui.demo -e command exit');
    await adb.shell('am broadcast -a com.android.systemui.demo -e command enter');

    // Force status bar content
    const notificationsVisible = nullishOrMap(statusBarConfig.notifications, (notifications) => Number(notifications === 'show'));
    if (notificationsVisible !== undefined) {
      await adb.shell(`am broadcast -a com.android.systemui.demo -e command notifications -e visible ${notificationsVisible}`);
    }

    const wifiSignal = nullishOrMap(statusBarConfig.wifiSignal, (wifiSignal) => wifiSignal);
    if (wifiSignal !== undefined) {
      await adb.shell('am broadcast -a com.android.systemui.demo -e command network -e wifi hide');
      if (wifiSignal !== 'none') {
        const wifiLevel = wifiSignal === 'strong' ? 4 : 2;
        await adb.shell(`am broadcast -a com.android.systemui.demo -e command network -e wifi show -e level ${wifiLevel} -e fully true`);
      }
    }

    const cellSignal = nullishOrMap(statusBarConfig.cellSignal, (cellSignal) => cellSignal);
    if (cellSignal !== undefined) {
      await adb.shell('am broadcast -a com.android.systemui.demo -e command network -e mobile hide');
      if (cellSignal !== 'none') {
        const cellLevel = cellSignal === 'strong' ? 4 : 2;
        await adb.shell(`am broadcast -a com.android.systemui.demo -e command network -e mobile show -e level ${cellLevel} -e fully true -e datatype none`);
      }
    }

    const clock = nullishOrMap(statusBarConfig.clock, (clock) => clock);
    if (clock !== undefined) {
      await adb.shell(`am broadcast -a com.android.systemui.demo -e command clock -e hhmm ${clock}`);
    }

    // Best to keep this last due to a "charging" indicator animation which can
    // break UI changes made by consequent commands
    const batteryLevel = nullishOrMap(statusBarConfig.batteryLevel, (level) => batteryPercent[level]);
    const charging = nullishOrMap(statusBarConfig.charging, (isCharging) => String(isCharging));
    if (batteryLevel !== undefined || charging !== undefined) {
      const command = 'am broadcast -a com.android.systemui.demo -e command battery' +
        (batteryLevel !== undefined ? ` -e level ${batteryLevel}` : '') +
        (charging !== undefined ? ` -e plugged ${charging}` : '');
      await adb.shell(command);
      await sleep(1500); // Wait for the charging animation to finish
    }
  }
}

module.exports = AndroidAllocDriver;
