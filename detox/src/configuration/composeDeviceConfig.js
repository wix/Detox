const _ = require('lodash');

/**
 *
 * @param {DetoxConfigErrorBuilder} errorBuilder
 * @param {*} rawDeviceConfig
 * @param {*} cliConfig
 * @returns {*}
 */
function composeDeviceConfig({ errorBuilder, rawDeviceConfig, cliConfig }) {
  if (!rawDeviceConfig || !rawDeviceConfig.type) {
    throw errorBuilder.missingConfigurationType();
  }

  const device = cliConfig.deviceName || rawDeviceConfig.device || rawDeviceConfig.name;

  if (_.isEmpty(device)) {
    throw errorBuilder.missingDeviceProperty();
  }

  rawDeviceConfig.device = device;
  delete rawDeviceConfig.name;

  return rawDeviceConfig;
}

module.exports = composeDeviceConfig;
