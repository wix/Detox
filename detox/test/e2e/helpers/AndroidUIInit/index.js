const { device } = require('detox');

const initCache = require('./DeviceInitCache');
const sleep = require('../../utils/sleep');
const log = {
  info: (...args) => console.log('[AndroidUIInit]', ...args),
}

class AndroidUIInitHelper {
  subscribe({ testEvents }) {
    testEvents.on('setup', this._handleSetupEvent.bind(this));
  }

  async _handleSetupEvent() {
    if (device.getPlatform() !== 'android') {
      return;
    }

    const adbName = device.id;

    if (initCache.isInitialized(adbName)) {
      log.info(`Skipping setup for ${adbName} (already initialized by this worker)`);
      return;
    }

    log.info(`Running init for ${adbName}`);

    const { adb } = device.deviceDriver;
    await this._setupKeyboardBehavior(adbName, adb);
    await this._setupPointerIndicators(adbName, adb);
    await this._setupNavigationMode(adbName, adb);
    await this._setupStatusBar(adbName, adb);

    initCache.markInitialized(adbName);
    log.info(`Finished init for ${adbName}`);
  }

  async _setupKeyboardBehavior(adbName, adb) {
    // Force-hide the on-screen keyboard
    await adb.shell(adbName, 'settings put Secure show_ime_with_hard_keyboard 0');
  }

  async _setupPointerIndicators(adbName, adb) {
    await adb.shell(adbName, 'settings put system show_touches 1');
    await adb.shell(adbName, 'settings put system pointer_location 1');
  }

  async _setupNavigationMode(adbName, adb) {
    await adb.shell(adbName, 'cmd overlay enable com.android.internal.systemui.navbar.threebutton');
  }

  async _setupStatusBar(adbName, adb) {
    // Enable, then get out (= reset status-bar) and back into demo mode
    await adb.shell(adbName, 'settings put global sysui_demo_allowed 1');
    await adb.shell(adbName, 'am broadcast -a com.android.systemui.demo -e command exit');
    await sleep(150);
    await adb.shell(adbName, 'am broadcast -a com.android.systemui.demo -e command enter');

    // Force status bar content
    await adb.shell(adbName, 'am broadcast -a com.android.systemui.demo -e command notifications -e visible false');
    await adb.shell(adbName, 'am broadcast -a com.android.systemui.demo -e command network -e wifi hide');
    await adb.shell(adbName, 'am broadcast -a com.android.systemui.demo -e command network -e wifi show -e level 4 -e fully true');
    await adb.shell(adbName, 'am broadcast -a com.android.systemui.demo -e command network -e mobile show -e datatype none -e level 4');
    // Best to keep this last due to a "charging" indicator animation which can
    // break UI changes made by consequent commands
    await adb.shell(adbName, 'am broadcast -a com.android.systemui.demo -e command battery -e level 100 -e plugged true');
    await sleep(500); // Wait for the animation to finish
  }
}

module.exports = new AndroidUIInitHelper();
