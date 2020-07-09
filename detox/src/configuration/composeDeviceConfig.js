const _ = require('lodash');

function validateType({ errorBuilder, rawDeviceConfig }) {
  if (!rawDeviceConfig || !rawDeviceConfig.type) {
    throw errorBuilder.missingConfigurationType();
  }
}

function getValidatedDeviceName({ errorBuilder, rawDeviceConfig, cliConfig }) {
  const device = cliConfig.deviceName || rawDeviceConfig.device || rawDeviceConfig.name;
  if (_.isEmpty(device)) {
    throw errorBuilder.missingDeviceProperty();
  }
  return device;
}

function validateUtilBinaryPaths({ errorBuilder, rawDeviceConfig }) {
  if (rawDeviceConfig.utilBinaryPaths && !_.isArray(rawDeviceConfig.utilBinaryPaths)) {
    throw errorBuilder.malformedUtilBinaryPaths();
  }
}

/**
 *
 * @param {DetoxConfigErrorBuilder} errorBuilder
 * @param {*} rawDeviceConfig
 * @param {*} cliConfig
 * @returns {*}
 */
function composeDeviceConfig({ errorBuilder, rawDeviceConfig, cliConfig }) {
  validateType({ errorBuilder, rawDeviceConfig });

  rawDeviceConfig.device = getValidatedDeviceName({ errorBuilder, rawDeviceConfig, cliConfig });
  delete rawDeviceConfig.name;

  validateUtilBinaryPaths({ errorBuilder, rawDeviceConfig });
  return rawDeviceConfig;
}

module.exports = composeDeviceConfig;
