const { device } = require('detox');

const initCache = require('./DeviceInitCache');
const sleep = require('../../utils/sleep');
const log = {
  info: (...args) => console.log('[AndroidUIInit]', ...args),
}
const adbWrapper = () => {
  const adbName = device.id;
  const { adb } = device.deviceDriver;

  const shell = async (cmd) => {
    await adb.shell(adbName, cmd);
    await sleep(200);
  };

  return {
    name: adbName,
    shell,
  };
};

class AndroidUIInitHelper {
  subscribe({ testEvents }) {
    testEvents.on('setup', this._handleSetupEvent.bind(this));
  }

  async _handleSetupEvent() {
    if (device.getPlatform() !== 'android') {
      return;
    }


    const adb = adbWrapper();

    if (initCache.isInitialized(adb.name)) {
      log.info(`Skipping setup for ${adb.name} (already initialized by this worker)`);
      return;
    }

    log.info(`Running init for ${adb.name}`);

    await this._setupKeyboardBehavior(adb);
    await this._setupPointerIndicators(adb);
    await this._setupNavigationMode(adb);
    await this._setupStatusBar(adb);

    initCache.markInitialized(adb.name);
    log.info(`Finished init for ${adb.name}`);
  }

  async _setupKeyboardBehavior(adb) {
    // Force-hide the on-screen keyboard
    await adb.shell('settings put Secure show_ime_with_hard_keyboard 0');
  }

  async _setupPointerIndicators(adb) {
    await adb.shell('settings put system show_touches 1');
    await adb.shell('settings put system pointer_location 1');
  }

  async _setupNavigationMode(adb) {
    await adb.shell('cmd overlay enable com.android.internal.systemui.navbar.threebutton');
  }

  // Ref: https://android.googlesource.com/platform/frameworks/base/+/master/packages/SystemUI/docs/demo_mode.md
  async _setupStatusBar(adb) {
    // Enable, then get out (= reset status-bar) and back into demo mode
    await adb.shell('settings put global sysui_demo_allowed 1');
    await adb.shell('am broadcast -a com.android.systemui.demo -e command exit');
    await adb.shell('am broadcast -a com.android.systemui.demo -e command enter');

    // Force status bar content
    await adb.shell('am broadcast -a com.android.systemui.demo -e command notifications -e visible false');
    await adb.shell('am broadcast -a com.android.systemui.demo -e command network -e wifi hide');
    await adb.shell('am broadcast -a com.android.systemui.demo -e command network -e wifi show -e level 4 -e fully true');
    await adb.shell('am broadcast -a com.android.systemui.demo -e command network -e mobile hide');
    // Best to keep this last due to a "charging" indicator animation which can
    // break UI changes made by consequent commands
    await adb.shell('am broadcast -a com.android.systemui.demo -e command battery -e level 100 -e plugged true');
    await sleep(1500); // Wait for the animation to finish
  }
}

module.exports = new AndroidUIInitHelper();
