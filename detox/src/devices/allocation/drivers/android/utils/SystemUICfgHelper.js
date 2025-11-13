/**
 * @typedef {import('../../../../common/drivers/DeviceCookie').DeviceCookie} DeviceCookie
 */

const _ = require('lodash');

const { DetoxConfigError } = require('../../../../../errors');
const sleep = require('../../../../../utils/sleep');

const presets = require('./systemUICfgPresets');

const batteryPrecents = {
  full: 100,
  half: 50,
  low: 20,
};

const navigationModes = {
//  For clarity: 2-button mode is not supported in recent Android versions; Detox ignores it to avoid confusion
//  '2-button': 'com.android.internal.systemui.navbar.twobutton',
  '3-button': 'com.android.internal.systemui.navbar.threebutton',
  'gesture': 'com.android.internal.systemui.navbar.gestural',
};

/**
 * Maps a nullish value (null or undefined) to undefined, otherwise applies the function.
 *
 * @param {any | undefined | null} value
 * @param {(value: any) => any | undefined} fn
 * @returns {any | undefined}
 */
const nullishOrMap = (value, fn) => (value === undefined || value === null) ? undefined : fn(value);

/**
 * Helper class for initializing Android System UI demo mode.
 */
class SystemUICfgHelper {
  /**
   * @param {object} options
   * @param {object} options.adb An ADB shell wrapper with a shell method
   * @param {string} options.adbName The ADB device name
   */
  constructor({ adb, adbName }) {
    this._adb = {
      shell: async (cmd) => {
        await adb.shell(adbName, cmd);
        await sleep(200);
      },
    };
  }

  /**
   * Resolves the system UI configuration, handling presets and extends.
   *
   * @param {Detox.DetoxSystemUI} systemUICfg
   * @returns {Detox.DetoxSystemUIConfig}
   */
  resolveConfig(systemUICfg) {
    const preset = _.isString(systemUICfg) && this._resolvePreset(systemUICfg);
    if (preset) {
      return preset;
    }

    /** @type {Detox.DetoxSystemUIConfig} */
    // @ts-ignore
    const _systemUICfg = systemUICfg;

    if (_systemUICfg.extends) {
      const preset = this._resolvePreset(_systemUICfg.extends);
      return _.chain({})
        .merge(preset)
        .merge(_systemUICfg)
        .omit('extends')
        .value();
    }
    return _systemUICfg;
  }

  /**
   * @param {Detox.DetoxSystemUIConfig} systemUIConfig
   */
  async setupKeyboardBehavior(systemUIConfig) {
    const showKbd = nullishOrMap(systemUIConfig.keyboard, (keyboard) => Number(keyboard === 'show'));

    if (showKbd !== undefined) {
      await this._adb.shell(`settings put Secure show_ime_with_hard_keyboard ${showKbd}`);
    }
  }

  /**
   * @param {Detox.DetoxSystemUIConfig} systemUIConfig
   */
  async setupPointerIndicators(systemUIConfig) {
    const showTouches = nullishOrMap(systemUIConfig.touches, (touches) => Number(touches === 'show'));
    if (showTouches !== undefined) {
      await this._adb.shell(`settings put system show_touches ${showTouches}`);
    }

    const showPointerLocationBar = nullishOrMap(systemUIConfig.pointerLocationBar, (pointerLocationBar) => Number(pointerLocationBar === 'show'));
    if (showPointerLocationBar !== undefined) {
      await this._adb.shell(`settings put system pointer_location ${showPointerLocationBar}`);
    }
  }

  /**
   * @param {Detox.DetoxSystemUIConfig} systemUIConfig
   */
  async setupNavigationMode(systemUIConfig) {
    const navigationMode = nullishOrMap(systemUIConfig.navigationMode, (navigationMode) => navigationModes[navigationMode]);
    if (navigationMode !== undefined) {
      await this._adb.shell(`cmd overlay enable ${navigationMode}`);
    }
  }

  /**
   * Ref: https://android.googlesource.com/platform/frameworks/base/+/master/packages/SystemUI/docs/demo_mode.md
   *
   * @param {Detox.DetoxSystemUIConfig} systemUIConfig
   */
  async setupStatusBar(systemUIConfig) {
    const { statusBar: statusBarConfig } = systemUIConfig;
    if (_.isUndefined(statusBarConfig)) {
      return;
    }

    // Enable, then get out (= reset status-bar) and back into demo mode
    await this._adb.shell('settings put global sysui_demo_allowed 1');
    await this._adb.shell('am broadcast -a com.android.systemui.demo -e command exit');
    await this._adb.shell('am broadcast -a com.android.systemui.demo -e command enter');

    // Force status bar content
    const notificationsVisible = nullishOrMap(statusBarConfig.notifications, (notifications) => Number(notifications === 'show'));
    if (notificationsVisible !== undefined) {
      await this._adb.shell(`am broadcast -a com.android.systemui.demo -e command notifications -e visible ${notificationsVisible}`);
    }

    const wifiSignal = nullishOrMap(statusBarConfig.wifiSignal, (wifiSignal) => wifiSignal);
    if (wifiSignal !== undefined) {
      await this._adb.shell('am broadcast -a com.android.systemui.demo -e command network -e wifi hide');
      if (wifiSignal !== 'none') {
        const wifiLevel = wifiSignal === 'strong' ? 4 : 2;
        await this._adb.shell(`am broadcast -a com.android.systemui.demo -e command network -e wifi show -e level ${wifiLevel} -e fully true`);
      }
    }

    const cellSignal = nullishOrMap(statusBarConfig.cellSignal, (cellSignal) => cellSignal);
    if (cellSignal !== undefined) {
      await this._adb.shell('am broadcast -a com.android.systemui.demo -e command network -e mobile hide');
      if (cellSignal !== 'none') {
        const cellLevel = cellSignal === 'strong' ? 4 : 2;
        await this._adb.shell(`am broadcast -a com.android.systemui.demo -e command network -e mobile show -e level ${cellLevel} -e fully true -e datatype none`);
      }
    }

    const clock = nullishOrMap(statusBarConfig.clock, (clock) => clock);
    if (clock !== undefined) {
      await this._adb.shell(`am broadcast -a com.android.systemui.demo -e command clock -e hhmm ${clock}`);
    }

    // Best to keep this last due to a "charging" indicator animation which can
    // break UI changes made by consequent commands
    const batteryLevel = nullishOrMap(statusBarConfig.batteryLevel, (level) => batteryPrecents[level]);
    const charging = nullishOrMap(statusBarConfig.charging, (isCharging) => String(isCharging));
    if (batteryLevel !== undefined || charging !== undefined) {
      const command = 'am broadcast -a com.android.systemui.demo -e command battery' +
        (batteryLevel !== undefined ? ` -e level ${batteryLevel}` : '') +
        (charging !== undefined ? ` -e plugged ${charging}` : '');
      await this._adb.shell(command);
      await sleep(1500); // Wait for the charging animation to finish
    }
  }

  /**
   * @param {Detox.DetoxSystemUI} presetName
   * @returns {Detox.DetoxSystemUIConfig | null}
   * @private
   */
  _resolvePreset(presetName) {
    const preset = presets[presetName];
    if (!preset) {
      throw new DetoxConfigError(`Invalid system UI preset name '${presetName}'`);
    }
    return preset;
  }
}

module.exports = SystemUICfgHelper;
