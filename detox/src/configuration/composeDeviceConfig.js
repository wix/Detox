const _ = require('lodash');
const DetoxConfigError = require('../errors/DetoxConfigError');

function composeDeviceConfig({ configurationName, rawDeviceConfig, cliConfig }) {
  if (!rawDeviceConfig.type) {
    throw new DetoxConfigError({
      message: `Missing "type" inside detox.configurations["${configurationName}"]`,
      hint: `Usually, 'type' property should hold the device type to test on (e.g. "ios.simulator" or "android.emulator").\nCheck again:`,
      debugInfo: rawDeviceConfig,
    });
  }

  const device = cliConfig.deviceName || rawDeviceConfig.device || rawDeviceConfig.name;

  if (_.isEmpty(device)) {
    throw new DetoxConfigError({
      message: `'device' property is empty in detox.configurations["${configurationName}"]`,
      hint: `It should hold the device query to run on (e.g. { "type": "iPhone 11 Pro" }, { "avdName": "Nexus_5X_API_29" }).\nCheck again:`,
      debugInfo: rawDeviceConfig,
    });
  }

  rawDeviceConfig.device = device;
  delete rawDeviceConfig.name;

  return rawDeviceConfig;
}


module.exports = composeDeviceConfig;
