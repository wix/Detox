const _ = require('lodash');
const parse = require('yargs/yargs').Parser;

const CLI_PARSER_OPTIONS = {
  configuration: {
    'short-option-groups': false,
  },
};

/**
 * @param {DetoxConfigErrorBuilder} opts.errorBuilder
 * @param {Detox.DetoxConfig} opts.globalConfig
 * @param {Detox.DetoxDeviceConfig} opts.deviceConfig
 * @param {Detox.DetoxConfiguration} opts.localConfig
 * @param {*} opts.cliConfig
 * @returns {Record<string, Detox.DetoxAppConfig>}
 */
function composeAppsConfig(opts) {
  const { localConfig } = opts;

  const appsConfig = localConfig.type
    ? composeAppsConfigFromPlain(opts)
    : composeAppsConfigFromAliased(opts);

  overrideAppLaunchArgs(appsConfig, opts.cliConfig);

  return appsConfig;
}

/**
 * @param {DetoxConfigErrorBuilder} opts.errorBuilder
 * @param {string} opts.configurationName
 * @param {Detox.DetoxDeviceConfig} opts.deviceConfig
 * @param {Detox.DetoxConfig} opts.globalConfig
 * @param {Detox.DetoxPlainConfiguration} opts.localConfig
 * @returns {Record<string, Detox.DetoxAppConfig>}
 */
function composeAppsConfigFromPlain(opts) {
  const { errorBuilder, localConfig } = opts;

  /** @type {Detox.DetoxAppConfig} */
  let appConfig;

  switch (opts.deviceConfig.type) {
    case 'android.attached':
    case 'android.emulator':
    case 'android.genycloud':
      appConfig = {
        type: 'android.apk',
        binaryPath: localConfig.binaryPath,
        bundleId: localConfig.bundleId,
        build: localConfig.build,
        testBinaryPath: localConfig.testBinaryPath,
        utilBinaryPaths: localConfig.utilBinaryPaths,
        launchArgs: localConfig.launchArgs,
      }; break;
    case 'ios.none':
    case 'ios.simulator':
      appConfig = {
        type: 'ios.app',
        binaryPath: localConfig.binaryPath,
        bundleId: localConfig.bundleId,
        build: localConfig.build,
        launchArgs: localConfig.launchArgs,
      };
      break;
    default:
      appConfig = {
        ...localConfig,
      };
  }

  validateAppConfig({
    errorBuilder,
    appConfig,
    deviceConfig: opts.deviceConfig,
    appPath: ['configurations', opts.configurationName],
  });

  return {
    '': _.omitBy(appConfig, _.isUndefined),
  };
}

/**
 * @param {DetoxConfigErrorBuilder} opts.errorBuilder
 * @param {string} opts.configurationName
 * @param {Detox.DetoxDeviceConfig} opts.deviceConfig
 * @param {Detox.DetoxConfig} opts.globalConfig
 * @param {Detox.DetoxAliasedConfiguration} opts.localConfig
 * @returns {Record<string, Detox.DetoxAppConfig>}
 */
function composeAppsConfigFromAliased(opts) {
  /* @type {Record<string, Detox.DetoxAppConfig>} */
  const result = {};
  const { configurationName, errorBuilder, deviceConfig, globalConfig, localConfig } = opts;

  if (!localConfig.app && !localConfig.apps) {
    throw errorBuilder.noAppIsDefined();
  }

  if (localConfig.app && localConfig.apps) {
    throw errorBuilder.ambiguousAppAndApps();
  }

  if (localConfig.app && Array.isArray(localConfig.app)) {
    throw errorBuilder.multipleAppsConfigArrayTypo();
  }

  if (localConfig.apps && !Array.isArray(localConfig.apps)) {
    throw errorBuilder.multipleAppsConfigShouldBeArray();
  }

  const appPathsMap = new Map();
  const preliminaryAppPaths = Array.isArray(localConfig.apps)
    ? localConfig.apps.map((_alias, index) => ['configurations', configurationName, 'apps', index])
    : [['configurations', configurationName, 'app']];

  for (const maybeAppPath of preliminaryAppPaths) {
    const maybeAlias = _.get(globalConfig, maybeAppPath);
    const appPath = _.isString(maybeAlias)
      ? ['apps', maybeAlias]
      : maybeAppPath;

    const appConfig = _.get(globalConfig, appPath);
    const appName = appConfig.name || '';
    appPathsMap.set(appConfig, appPath);

    validateAppConfig({
      errorBuilder,
      deviceConfig,
      appConfig,
      appPath
    });

    if (!result[appName]) {
      result[appName] = appConfig;
    } else {
      throw opts.errorBuilder.duplicateAppConfig({
        appName,
        appPath,
        preExistingAppPath: appPathsMap.get(result[appName]),
      });
    }
  }

  return _.mapValues(result, value => _.clone(value));
}

function overrideAppLaunchArgs(appsConfig, cliConfig) {
  const cliLaunchArgs = cliConfig.appLaunchArgs
    ? _.omit(parse(cliConfig.appLaunchArgs, CLI_PARSER_OPTIONS), ['_', '--'])
    : null;

  for (const appConfig of _.values(appsConfig)) {
    if (!appConfig.launchArgs && !cliLaunchArgs) {
      continue;
    }

    appConfig.launchArgs = _.chain(cliLaunchArgs)
      .defaults(appConfig.launchArgs)
      .omitBy(value => value == null || value === false)
      .value();
  }
}

function validateAppConfig({ appConfig, appPath, deviceConfig, errorBuilder }) {
  const deviceType = deviceConfig.type;
  const allowedAppsTypes = DEVICE_TYPE_TO_APP_TYPE[deviceType];

  if (allowedAppsTypes && !allowedAppsTypes.includes(appConfig.type)) {
    throw errorBuilder.invalidAppType(appPath, deviceConfig);
  }

  if (!appConfig.binaryPath) {
    throw errorBuilder.missingAppBinaryPath(appPath);
  }

  if (appConfig.launchArgs) {
    if (!_.isObject(appConfig.launchArgs)) {
      throw errorBuilder.malformedAppLaunchArgs(appPath);
    }

    const invalidLaunchArg = _.findKey(appConfig.launchArgs, (value) => {
      return value != null && !_.isString(value);
    });

    if (invalidLaunchArg) {
      throw errorBuilder.malformedAppLaunchArgsProperty([...appPath, 'launchArgs', invalidLaunchArg]);
    }
  }

  if (appConfig.utilBinaryPaths && !Array.isArray(appConfig.utilBinaryPaths)) {
    throw errorBuilder.malformedUtilBinaryPaths(appPath);
  }
}

const DEVICE_TYPE_TO_APP_TYPE = {
  'ios.simulator': ['ios.app'],
  'ios.none': ['ios.app'],
  'android.attached': ['android.apk'],
  'android.emulator': ['android.apk'],
  'android.genycloud': ['android.apk'],
};

module.exports = composeAppsConfig;
