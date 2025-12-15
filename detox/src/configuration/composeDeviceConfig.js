// @ts-nocheck
const _ = require('lodash');

const environmentFactory = require('../environmentFactory');
const log = require('../utils/logger').child({ cat: 'config' });

/**
 * @param {DetoxConfigErrorComposer} opts.errorComposer
 * @param {Detox.DetoxConfig} opts.globalConfig
 * @param {Detox.DetoxConfiguration} opts.localConfig
 * @param {*} opts.cliConfig
 * @returns {Detox.DetoxDeviceConfig}
 */
function composeDeviceConfig(opts) {
  const deviceConfig = composeDeviceConfigFromAliased(opts);
  applyCLIOverrides(deviceConfig, opts.cliConfig);
  deviceConfig.device = unpackDeviceQuery(deviceConfig);

  return deviceConfig;
}

/**
 * @param {DetoxConfigErrorComposer} opts.errorComposer
 * @param {Detox.DetoxConfig} opts.globalConfig
 * @param {Detox.DetoxConfiguration} opts.localConfig
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
 * Validates systemUI configuration
 * @param {string | object} systemUI - The systemUI configuration
 * @param {string} deviceAlias - The device alias for error reporting
 * @param {DetoxConfigErrorComposer} errorComposer - Error composer instance
 */
function validateSystemUIConfig(systemUI, deviceAlias, errorComposer) {
  if (_.isString(systemUI)) {
    if (!['minimal', 'genymotion'].includes(systemUI)) {
      throw errorComposer.malformedDeviceProperty(deviceAlias, 'systemUI');
    }
    return;
  }

  if (!_.isObject(systemUI)) {
    throw errorComposer.malformedDeviceProperty(deviceAlias, 'systemUI');
  }

  if (systemUI.extends !== undefined) {
    if (!['minimal', 'genymotion'].includes(systemUI.extends)) {
      throw errorComposer.malformedDeviceProperty(deviceAlias, 'systemUI');
    }
  }

  if (systemUI.keyboard !== undefined && systemUI.keyboard !== null) {
    if (!['hide', 'show'].includes(systemUI.keyboard)) {
      throw errorComposer.malformedDeviceProperty(deviceAlias, 'systemUI');
    }
  }

  if (systemUI.touches !== undefined && systemUI.touches !== null) {
    if (!['hide', 'show'].includes(systemUI.touches)) {
      throw errorComposer.malformedDeviceProperty(deviceAlias, 'systemUI');
    }
  }

  if (systemUI.pointerLocationBar !== undefined && systemUI.pointerLocationBar !== null) {
    if (!['hide', 'show'].includes(systemUI.pointerLocationBar)) {
      throw errorComposer.malformedDeviceProperty(deviceAlias, 'systemUI');
    }
  }

  if (systemUI.navigationMode !== undefined && systemUI.navigationMode !== null) {
    if (!['3-button', 'gesture'].includes(systemUI.navigationMode)) {
      throw errorComposer.malformedDeviceProperty(deviceAlias, 'systemUI');
    }
  }

  if (systemUI.statusBar !== undefined && systemUI.statusBar !== null) {
    if (!_.isObject(systemUI.statusBar)) {
      throw errorComposer.malformedDeviceProperty(deviceAlias, 'systemUI');
    }

    if (systemUI.statusBar.notifications !== undefined && systemUI.statusBar.notifications !== null) {
      if (!['hide', 'show'].includes(systemUI.statusBar.notifications)) {
        throw errorComposer.malformedDeviceProperty(deviceAlias, 'systemUI');
      }
    }

    if (systemUI.statusBar.wifiSignal !== undefined && systemUI.statusBar.wifiSignal !== null) {
      if (!['weak', 'strong', 'none'].includes(systemUI.statusBar.wifiSignal)) {
        throw errorComposer.malformedDeviceProperty(deviceAlias, 'systemUI');
      }
    }

    if (systemUI.statusBar.cellSignal !== undefined && systemUI.statusBar.cellSignal !== null) {
      if (!['strong', 'weak', 'none'].includes(systemUI.statusBar.cellSignal)) {
        throw errorComposer.malformedDeviceProperty(deviceAlias, 'systemUI');
      }
    }

    if (systemUI.statusBar.batteryLevel !== undefined && systemUI.statusBar.batteryLevel !== null) {
      if (!['full', 'half', 'low'].includes(systemUI.statusBar.batteryLevel)) {
        throw errorComposer.malformedDeviceProperty(deviceAlias, 'systemUI');
      }
    }

    if (systemUI.statusBar.charging !== undefined && systemUI.statusBar.charging !== null) {
      if (!_.isBoolean(systemUI.statusBar.charging)) {
        throw errorComposer.malformedDeviceProperty(deviceAlias, 'systemUI');
      }
    }

    if (systemUI.statusBar.clock !== undefined && systemUI.statusBar.clock !== null) {
      if (!_.isString(systemUI.statusBar.clock) || !/^\d{2}\d{2}$/.test(systemUI.statusBar.clock)) {
        throw errorComposer.malformedDeviceProperty(deviceAlias, 'systemUI');
      }
    }
  }
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

    if (!deviceConfig.gpuMode.match(/^(auto|host|swiftshader_indirect|angle_indirect|guest|off)$/)) {
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

    if (deviceConfig.type !== 'ios.simulator' && deviceConfig.type !== 'android.emulator') {
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

  if (deviceConfig.systemUI !== undefined) {
    validateSystemUIConfig(deviceConfig.systemUI, deviceAlias, errorComposer);

    if (!deviceConfig.type.match(/^android\.(emulator|genycloud|attached)$/)) {
      throw errorComposer.unsupportedDeviceProperty(deviceAlias, 'systemUI');
    }
  }

  if (_.isObject(deviceConfig.device)) {
    const expectedProperties = EXPECTED_DEVICE_MATCHER_PROPS[deviceConfig.type];
    /* istanbul ignore else */
    if (!_.isEmpty(expectedProperties)) {
      const minimalShape = _.pick(deviceConfig.device, expectedProperties);

      if (_.isEmpty(minimalShape)) {
        throw errorComposer.missingDeviceMatcherProperties(deviceAlias, expectedProperties);
      }
    }
  }
}

function applyCLIOverrides(deviceConfig, cliConfig) {
  _assignCLIConfigIfSupported('device-name', cliConfig.deviceName, deviceConfig, 'device');
  _assignCLIConfigIfSupported('device-boot-args', cliConfig.deviceBootArgs, deviceConfig, 'bootArgs');
  _assignCLIConfigIfSupported('headless', cliConfig.headless, deviceConfig, 'headless');
  _assignCLIConfigIfSupported('force-adb-install', cliConfig.forceAdbInstall, deviceConfig, 'forceAdbInstall');
  _assignCLIConfigIfSupported('gpu', cliConfig.gpu, deviceConfig, 'gpuMode');
  _assignCLIConfigIfSupported('readonly-emu', cliConfig.readonlyEmu, deviceConfig, 'readonly');
}

function _assignCLIConfigIfSupported(argName, argValue, deviceConfig, propertyName) {
  if (argValue === undefined) {
    return;
  }

  const deviceType = deviceConfig.type;
  const supportedDeviceTypesPrefixes = _supportedDeviceTypesPrefixes(argName);
  if (!supportedDeviceTypesPrefixes.some((prefix) => deviceType.startsWith(prefix))) {
    log.warn(`--${argName} CLI override is not supported by device type = "${deviceType}" and will be ignored`);
    return;
  }

  deviceConfig[propertyName] = argValue;
}

function _supportedDeviceTypesPrefixes(argName) {
  switch (argName) {
    case 'device-name':
      return [''];

    case 'force-adb-install':
      return ['android.'];

    case 'gpu':
    case 'readonly-emu':
      return ['android.emulator'];

    case 'device-boot-args':
    case 'headless':
      return ['ios.simulator', 'android.emulator'];
  }
}

function unpackDeviceQuery(deviceConfig) {
  const query = deviceConfig.device;
  if (!_.isString(query)) {
    return query;
  }

  switch (deviceConfig.type) {
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
  'ios.simulator': ['type', 'name', 'id'],
  'android.attached': ['adbName'],
  'android.emulator': ['avdName'],
  'android.genycloud': ['recipeUUID', 'recipeName'],
};

const KNOWN_TYPES = new Set(Object.keys(EXPECTED_DEVICE_MATCHER_PROPS));

module.exports = composeDeviceConfig;
