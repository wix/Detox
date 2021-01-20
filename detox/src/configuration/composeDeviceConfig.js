const _ = require('lodash');
const parse = require('yargs/yargs').Parser;

function validateType({ errorBuilder, localConfig }) {
  if (!localConfig || !localConfig.type) {
    throw errorBuilder.missingConfigurationType();
  }
}

function getValidatedDeviceName({ errorBuilder, localConfig, cliConfig }) {
  const device = cliConfig.deviceName || localConfig.device || localConfig.name;
  if (_.isEmpty(device)) {
    throw errorBuilder.missingDeviceProperty();
  }
  return device;
}

function validateAppLaunchArgs({ errorBuilder, localConfig }) {
  if (!localConfig.launchArgs) {
    return;
  }

  if (!_.isObject(localConfig.launchArgs)) {
    throw errorBuilder.malformedAppLaunchArgs();
  }

  const nonStringPropertyName = _.chain(localConfig.launchArgs)
    .entries()
    .find(([key, value]) => value != null && !_.isString(value))
    .thru((entry) => entry ? entry[0] : null)
    .value()

  if (nonStringPropertyName) {
    throw errorBuilder.malformedAppLaunchArgsProperty(nonStringPropertyName);
  }
}

function validateUtilBinaryPaths({ errorBuilder, localConfig }) {
  if (localConfig.utilBinaryPaths && !_.isArray(localConfig.utilBinaryPaths)) {
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
 * @param {DetoxConfigErrorBuilder} errorBuilder
 * @param {Detox.DetoxConfiguration} localConfig
 * @param {*} cliConfig
 */
function composeDeviceConfig({ errorBuilder, localConfig, cliConfig }) {
  validateType({ errorBuilder, localConfig });
  validateAppLaunchArgs({ errorBuilder, localConfig });
  mergeAppLaunchArgsFromCLI(localConfig, cliConfig);

  localConfig.device = getValidatedDeviceName({ errorBuilder, localConfig, cliConfig });
  delete localConfig.name;


  validateUtilBinaryPaths({ errorBuilder, localConfig });
  return localConfig;
}

module.exports = composeDeviceConfig;
