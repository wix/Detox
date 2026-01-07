// @ts-nocheck
const _ = require('lodash');
const parse = require('yargs-parser');

const deviceAppTypes = require('./utils/deviceAppTypes');

const CLI_PARSER_OPTIONS = {
  configuration: {
    'short-option-groups': false,
  },
};

/**
 * @param {DetoxConfigErrorComposer} opts.errorComposer
 * @param {Detox.DetoxConfig} opts.globalConfig
 * @param {Detox.DetoxDeviceConfig} opts.deviceConfig
 * @param {Detox.DetoxConfiguration} opts.localConfig
 * @param {*} opts.cliConfig
 * @returns {Record<string, Detox.DetoxAppConfig>}
 */
function composeAppsConfig(opts) {
  const appsConfig = composeAppsConfigFromAliased(opts);
  overrideAppLaunchArgs(appsConfig, opts.cliConfig);

  return appsConfig;
}

/**
 * @param {DetoxConfigErrorComposer} opts.errorComposer
 * @param {string} opts.configurationName
 * @param {Detox.DetoxDeviceConfig} opts.deviceConfig
 * @param {Detox.DetoxConfig} opts.globalConfig
 * @param {Detox.DetoxConfiguration} opts.localConfig
 * @returns {Record<string, Detox.DetoxAppConfig>}
 */
function composeAppsConfigFromAliased(opts) {
  /* @type {Record<string, Detox.DetoxAppConfig>} */
  const result = {};
  const { configurationName, errorComposer, deviceConfig, globalConfig, localConfig } = opts;

  const isBuiltinDevice = Boolean(deviceAppTypes[deviceConfig.type]);
  if (localConfig.app == null && localConfig.apps == null) {
    if (isBuiltinDevice) {
      throw errorComposer.noAppIsDefined(deviceConfig.type);
    } else {
      return result;
    }
  }

  if (localConfig.app != null && localConfig.apps != null) {
    throw errorComposer.ambiguousAppAndApps();
  }

  if (localConfig.app && Array.isArray(localConfig.app)) {
    throw errorComposer.multipleAppsConfigArrayTypo();
  }

  if (localConfig.apps && !Array.isArray(localConfig.apps)) {
    throw errorComposer.multipleAppsConfigShouldBeArray();
  }

  const appPathsMap = new Map();
  const preliminaryAppPaths = Array.isArray(localConfig.apps)
    ? localConfig.apps.map((_alias, index) => ['configurations', configurationName, 'apps', index])
    : [['configurations', configurationName, 'app']];

  for (const maybeAppPath of preliminaryAppPaths) {
    const maybeAlias = _.get(globalConfig, maybeAppPath);
    const isAlias = _.isString(maybeAlias);
    const appPath = isAlias
      ? ['apps', maybeAlias]
      : maybeAppPath;

    const appConfig = _.get(globalConfig, appPath);
    if (_.isEmpty(appConfig)) {
      if (isAlias) {
        if (_.size(globalConfig.apps) > 0) {
          throw errorComposer.cantResolveAppAlias(maybeAlias);
        } else {
          throw errorComposer.thereAreNoAppConfigs(maybeAlias);
        }
      } else {
        throw errorComposer.appConfigIsUndefined(appPath);
      }
    }

    const appName = appConfig.name || 'default';
    appPathsMap.set(appConfig, appPath);

    validateAppConfig({
      errorComposer,
      deviceConfig,
      appConfig,
      appPath
    });

    if (!result[appName]) {
      result[appName] = appConfig;
    } else {
      throw opts.errorComposer.duplicateAppConfig({
        appPath,
        appName: appConfig.name,
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

function validateAppConfig({ appConfig, appPath, deviceConfig, errorComposer }) {
  const deviceType = deviceConfig.type;
  const allowedAppTypes = deviceAppTypes[deviceType];

  if (allowedAppTypes && !allowedAppTypes.includes(appConfig.type)) {
    throw errorComposer.invalidAppType({
      appPath,
      allowedAppTypes,
      deviceType,
    });
  }

  if (allowedAppTypes && !appConfig.binaryPath) {
    throw errorComposer.missingAppBinaryPath(appPath);
  }

  if (appConfig.launchArgs && !_.isObject(appConfig.launchArgs)) {
    throw errorComposer.malformedAppLaunchArgs(appPath);
  }

  if (appConfig.type !== 'android.apk' && appConfig.reversePorts) {
    throw errorComposer.unsupportedReversePorts(appPath);
  }
}

module.exports = composeAppsConfig;
