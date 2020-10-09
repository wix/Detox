const _ = require('lodash');
const parse = require('yargs/yargs').Parser;

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

function validateAppLaunchArgs({ errorBuilder, rawDeviceConfig }) {
  if (rawDeviceConfig.launchArgs && !_.isObject(rawDeviceConfig.launchArgs)) {
    throw errorBuilder.malformedAppLaunchArgs();
  }
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
  validateAppLaunchArgs({ errorBuilder, rawDeviceConfig });

  rawDeviceConfig.device = getValidatedDeviceName({ errorBuilder, rawDeviceConfig, cliConfig });
  delete rawDeviceConfig.name;

  if (cliConfig.appLaunchArgs) {
    rawDeviceConfig.launchArgs = _.chain({})
      .thru(() => parse(cliConfig.appLaunchArgs, {
        configuration: {
          'short-option-groups': false,
        },
      }))
      .omit(['_', '--'])
      .defaults(rawDeviceConfig.launchArgs)
      .omitBy(value => value === false)
      .value();
  }

  validateUtilBinaryPaths({ errorBuilder, rawDeviceConfig });
  return rawDeviceConfig;
}

module.exports = composeDeviceConfig;
