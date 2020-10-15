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
  if (!rawDeviceConfig.launchArgs) {
    return;
  }

  if (!_.isObject(rawDeviceConfig.launchArgs)) {
    throw errorBuilder.malformedAppLaunchArgs();
  }

  const nonStringPropertyName = _.chain(rawDeviceConfig.launchArgs)
    .entries()
    .find(([key, value]) => value != null && !_.isString(value))
    .thru((entry) => entry ? entry[0] : null)
    .value()

  if (nonStringPropertyName) {
    throw errorBuilder.malformedAppLaunchArgsProperty(nonStringPropertyName);
  }
}

function validateUtilBinaryPaths({ errorBuilder, rawDeviceConfig }) {
  if (rawDeviceConfig.utilBinaryPaths && !_.isArray(rawDeviceConfig.utilBinaryPaths)) {
    throw errorBuilder.malformedUtilBinaryPaths();
  }
}

function mergeAppLaunchArgsFromCLI(deviceConfig, cliConfig) {
  if (!cliConfig.appLaunchArgs) {
    return;
  }

  deviceConfig.launchArgs = _.chain({})
    .thru(() => parse(cliConfig.appLaunchArgs, {
      configuration: {
        'short-option-groups': false,
      },
    }))
    .omit(['_', '--'])
    .defaults(deviceConfig.launchArgs)
    .omitBy(value => value === false)
    .value();
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
  mergeAppLaunchArgsFromCLI(rawDeviceConfig, cliConfig);

  rawDeviceConfig.device = getValidatedDeviceName({ errorBuilder, rawDeviceConfig, cliConfig });
  delete rawDeviceConfig.name;


  validateUtilBinaryPaths({ errorBuilder, rawDeviceConfig });
  return rawDeviceConfig;
}

module.exports = composeDeviceConfig;
