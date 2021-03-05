const _ = require('lodash');
const driverRegistry = require('../devices/DriverRegistry').default;

/**
 * @param {DetoxConfigErrorComposer} opts.errorComposer
 * @param {Detox.DetoxConfig} opts.globalConfig
 * @param {Detox.DetoxConfiguration} opts.localConfig
 * @param {*} opts.cliConfig
 * @returns {Detox.DetoxDeviceConfig}
 */
function composeDeviceConfig(opts) {
  const { localConfig, cliConfig } = opts;

  const deviceConfig = localConfig.type
    ? composeDeviceConfigFromPlain(opts)
    : composeDeviceConfigFromAliased(opts);

  if (cliConfig.deviceName) {
    deviceConfig.device = cliConfig.deviceName;
  }

  return deviceConfig;
}

/**
 * @param {DetoxConfigErrorComposer} opts.errorComposer
 * @param {Detox.DetoxConfig} opts.globalConfig
 * @param {Detox.DetoxPlainConfiguration} opts.localConfig
 * @returns {Detox.DetoxDeviceConfig}
 */
function composeDeviceConfigFromPlain(opts) {
  const { errorComposer, localConfig } = opts;

  const type = localConfig.type;
  const device = localConfig.device || localConfig.name;
  const utilBinaryPaths = localConfig.utilBinaryPaths;

  const deviceConfig = type in EXPECTED_DEVICE_MATCHER_PROPS
    ? { type, device, utilBinaryPaths }
    : { ...localConfig };

  validateDeviceConfig({ deviceConfig, errorComposer });

  return deviceConfig;
}

/**
 * @param {DetoxConfigErrorComposer} opts.errorComposer
 * @param {Detox.DetoxConfig} opts.globalConfig
 * @param {Detox.DetoxAliasedConfiguration} opts.localConfig
 * @returns {Detox.DetoxDeviceConfig}
 */
function composeDeviceConfigFromAliased(opts) {
  const { errorComposer, globalConfig, localConfig } = opts;

  /** @type {Detox.DetoxDeviceConfig} */
  let deviceConfig;

  const isAliased = typeof localConfig.device === 'string';

  if (isAliased) {
    if (_.isEmpty(globalConfig.devices)) {
      throw errorComposer.thereAreNoDeviceConfigs(localConfig.device);
    } else {
      deviceConfig = globalConfig.devices[localConfig.device];
    }

    if (!deviceConfig) {
      throw errorComposer.cantResolveDeviceAlias(localConfig.device);
    }
  } else {
    if (!localConfig.device) {
      throw errorComposer.deviceConfigIsUndefined();
    }

    deviceConfig = localConfig.device;
  }

  validateDeviceConfig({
    deviceConfig,
    errorComposer,
    deviceAlias: isAliased ? localConfig.device : undefined
  });

  return { ...deviceConfig };
}

/**
 * @param {DetoxConfigErrorComposer} errorComposer
 * @param {Detox.DetoxDeviceConfig} deviceConfig
 * @param {String | undefined} deviceAlias
 */
function validateDeviceConfig({ deviceConfig, errorComposer, deviceAlias }) {
  if (!deviceConfig.type) {
    throw errorComposer.missingDeviceType(deviceAlias);
  }

  const DriverClass = _.attempt(() => driverRegistry.resolve(deviceConfig.type));
  if (_.isError(DriverClass)) {
    throw errorComposer.invalidDeviceType(deviceAlias, deviceConfig, DriverClass);
  }

  if (deviceConfig.utilBinaryPaths) {
    if (!Array.isArray(deviceConfig.utilBinaryPaths)) {
      throw errorComposer.malformedUtilBinaryPaths(deviceAlias);
    }

    if (deviceConfig.utilBinaryPaths.some(s => !_.isString(s))) {
      throw errorComposer.malformedUtilBinaryPaths(deviceAlias);
    }
  }

  if (_.isString(deviceConfig.device)) {
    return;
  }

  const expectedProperties = EXPECTED_DEVICE_MATCHER_PROPS[deviceConfig.type];
  if (!expectedProperties) {
    return;
  }

  if (_.isEmpty(_.pick(deviceConfig.device, expectedProperties))) {
    throw errorComposer.missingDeviceMatcherProperties(deviceAlias, expectedProperties);
  }
}

const EXPECTED_DEVICE_MATCHER_PROPS = {
  'ios.none': null,
  'ios.simulator': ['type', 'name', 'id'],
  'android.attached': ['adbName'],
  'android.emulator': ['avdName'],
  'android.genycloud': ['recipeUUID', 'recipeName'],
};

module.exports = composeDeviceConfig;
