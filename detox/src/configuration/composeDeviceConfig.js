const _ = require('lodash');

const environmentFactory = require('../environmentFactory');
const log = require('../utils/logger').child({ __filename });

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

  applyCLIOverrides(deviceConfig, cliConfig);
  deviceConfig.device = unpackDeviceQuery(deviceConfig);

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
    ? _.omitBy({ type, device, utilBinaryPaths }, _.isUndefined)
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

  const maybeError = _.attempt(() => environmentFactory.validateConfig(deviceConfig));
  if (_.isError(maybeError)) {
      throw errorComposer.invalidDeviceType(deviceAlias, deviceConfig, maybeError);
  }

  if (!KNOWN_TYPES.has(deviceConfig.type)) {
    return;
  }

  if (deviceConfig.bootArgs != null) {
    if (!_.isString(deviceConfig.bootArgs)) {
      throw errorComposer.malformedDeviceProperty(deviceAlias, 'bootArgs');
    }

    if (deviceConfig.type !== 'ios.simulator' && deviceConfig.type !== 'android.emulator') {
      throw errorComposer.unsupportedDeviceProperty(deviceAlias, 'bootArgs');
    }
  }

  if (deviceConfig.utilBinaryPaths != null) {
    if (!Array.isArray(deviceConfig.utilBinaryPaths)) {
      throw errorComposer.malformedDeviceProperty(deviceAlias, 'utilBinaryPaths');
    }

    if (deviceConfig.utilBinaryPaths.some(s => !_.isString(s))) {
      throw errorComposer.malformedDeviceProperty(deviceAlias, 'utilBinaryPaths');
    }

    if (!deviceConfig.type.match(/^android\.(attached|emulator|genycloud)$/)) {
      throw errorComposer.unsupportedDeviceProperty(deviceAlias, 'utilBinaryPaths');
    }
  }

  if (deviceConfig.forceAdbInstall !== undefined) {
    if (!_.isBoolean(deviceConfig.forceAdbInstall)) {
      throw errorComposer.malformedDeviceProperty(deviceAlias, 'forceAdbInstall');
    }

    if (!deviceConfig.type.match(/^android\.(attached|emulator|genycloud)$/)) {
      throw errorComposer.unsupportedDeviceProperty(deviceAlias, 'forceAdbInstall');
    }
  }

  if (deviceConfig.gpuMode !== undefined) {
    if (!_.isString(deviceConfig.gpuMode)) {
      throw errorComposer.malformedDeviceProperty(deviceAlias, 'gpuMode');
    }

    if (!deviceConfig.gpuMode.match(/^(auto|host|swiftshader_indirect|angle_indirect|guest)$/)) {
      throw errorComposer.malformedDeviceProperty(deviceAlias, 'gpuMode');
    }

    if (deviceConfig.type !== 'android.emulator') {
      throw errorComposer.unsupportedDeviceProperty(deviceAlias, 'gpuMode');
    }
  }

  if (deviceConfig.headless !== undefined) {
    if (!_.isBoolean(deviceConfig.headless)) {
      throw errorComposer.malformedDeviceProperty(deviceAlias, 'headless');
    }

    if (deviceConfig.type !== 'android.emulator') {
      throw errorComposer.unsupportedDeviceProperty(deviceAlias, 'headless');
    }
  }

  if (deviceConfig.readonly !== undefined) {
    if (!_.isBoolean(deviceConfig.readonly)) {
      throw errorComposer.malformedDeviceProperty(deviceAlias, 'readonly');
    }

    if (deviceConfig.type !== 'android.emulator') {
      throw errorComposer.unsupportedDeviceProperty(deviceAlias, 'readonly');
    }
  }

  if (_.isObject(deviceConfig.device)) {
    const expectedProperties = EXPECTED_DEVICE_MATCHER_PROPS[deviceConfig.type];
    if (!_.isEmpty(expectedProperties)) {
      const minimalShape = _.pick(deviceConfig.device, expectedProperties);

      if (_.isEmpty(minimalShape)) {
        throw errorComposer.missingDeviceMatcherProperties(deviceAlias, expectedProperties);
      }
    }
  }
}

function applyCLIOverrides(deviceConfig, cliConfig) {
  if (cliConfig.deviceName) {
    deviceConfig.device = cliConfig.deviceName;
  }

  const deviceType = deviceConfig.type;
  if (cliConfig.deviceBootArgs) {
    if ((deviceType === 'ios.simulator') || (deviceType === 'android.emulator')) {
      deviceConfig.bootArgs = cliConfig.deviceBootArgs;
    } else {
      log.warn(`--device-boot-args CLI override is not supported by device type = "${deviceType}" and will be ignored`);
    }
  }

  if (cliConfig.forceAdbInstall !== undefined) {
    if (deviceType.startsWith('android.')) {
      deviceConfig.forceAdbInstall = cliConfig.forceAdbInstall;
    } else {
      log.warn(`--force-adb-install CLI override is not supported by device type = "${deviceType}" and will be ignored`);
    }
  }

  const emulatorCLIConfig = _.pick(cliConfig, ['headless', 'gpu', 'readonlyEmu']);
  const emulatorOverrides = _.omitBy({
    headless: cliConfig.headless,
    gpuMode: cliConfig.gpu,
    readonly: cliConfig.readonlyEmu,
  }, _.isUndefined);

  if (!_.isEmpty(emulatorOverrides)) {
    if (deviceType === 'android.emulator') {
      Object.assign(deviceConfig, emulatorOverrides);
    } else {
      const flags = Object.keys(emulatorCLIConfig).map(key => '--' + _.kebabCase(key)).join(', ');
      log.warn(`${flags} CLI overriding is not supported by device type = "${deviceType}" and will be ignored`);
    }
  }
}

function unpackDeviceQuery(deviceConfig) {
  const query = deviceConfig.device;
  if (!_.isString(query)) {
    return query;
  }

  switch (deviceConfig.type) {
    case 'ios.none':
    case 'ios.simulator':
      if (_.includes(query, ',')) {
        const [type, os] = _.split(query, /\s*,\s*/);
        return { type, os };
      }

      return { type: query };
    case 'android.attached':
      return { adbName: query };
    case 'android.emulator':
      return { avdName: query };
    case 'android.genycloud':
      return { recipeName: query };
    default:
      return query;
  }
}

const EXPECTED_DEVICE_MATCHER_PROPS = {
  'ios.none': null,
  'ios.simulator': ['type', 'name', 'id'],
  'android.attached': ['adbName'],
  'android.emulator': ['avdName'],
  'android.genycloud': ['recipeUUID', 'recipeName'],
};

const KNOWN_TYPES = new Set(Object.keys(EXPECTED_DEVICE_MATCHER_PROPS));

module.exports = composeDeviceConfig;
