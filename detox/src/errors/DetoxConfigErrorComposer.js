const _ = require('lodash');

const deviceAppTypes = require('../configuration/utils/deviceAppTypes');

const DetoxConfigError = require('./DetoxConfigError');
const DetoxInternalError = require('./DetoxInternalError');
const J = s => JSON.stringify(s);

class DetoxConfigErrorComposer {
  constructor() {
    this.setConfigurationName();
    this.setDetoxConfigPath();
    this.setDetoxConfig();
    this.setExtends();
  }

  clone() {
    return new DetoxConfigErrorComposer()
      .setConfigurationName(this.configurationName)
      .setDetoxConfigPath(this.filepath)
      .setDetoxConfig(this.contents)
      .setExtends(this._extends);
  }

  _atPath() {
    return this.filepath ? ` at path:\n${this.filepath}` : '.';
  }

  _inTheAppConfig() {
    const { type } = this._getSelectedConfiguration();
    if (type) {
      return `in configuration ${J(this.configurationName)}`;
    }

    return `in the app config`;
  }

  _getSelectedConfiguration() {
    return _.get(this.contents, ['configurations', this.configurationName]);
  }

  _focusOnConfiguration(postProcess = _.identity) {
    const configuration = _.get(this.contents, ['configurations', this.configurationName]);
    if (configuration === undefined) {
      return;
    }

    return {
      configurations: {
        [this.configurationName]: postProcess(configuration)
      },
    };
  }

  _getDeviceConfig(deviceAlias) {
    let config = undefined;

    this._focusOnDeviceConfig(deviceAlias, (value) => {
      config = value;
      return value;
    });

    return config;
  }

  _focusOnDeviceConfig(deviceAlias, postProcess = _.identity) {
    const { type, device } = this._getSelectedConfiguration();
    if (!deviceAlias) {
      if (type || !device) {
        return this._focusOnConfiguration(postProcess);
      } else {
        return this._focusOnConfiguration(c => {
          postProcess(c.device);
          return _.pick(c, 'device');
        });
      }
    }

    return {
      devices: {
        [device]: postProcess(this.contents.devices[device]),
      },
    };
  }

  _focusOnAppConfig(appPath, postProcess = _.identity) {
    const value = _.get(this.contents, appPath);
    return _.set({}, appPath, postProcess(value));
  }

  _resolveSelectedDeviceConfig(alias) {
    if (alias) {
      return this.contents.devices[alias];
    } else {
      const config = this._getSelectedConfiguration();
      return config.type ? config : config.device;
    }
  }

  _ensureProperty(...names) {
    return obj => {
      for (const name of names) {
        return _.set(obj, name, _.get(obj, name));
      }
    };
  }

  // region setters
  setConfigurationName(configurationName) {
    this.configurationName = configurationName || '';
    return this;
  }

  setDetoxConfigPath(filepath) {
    this.filepath = filepath || '';
    return this;
  }

  setDetoxConfig(contents) {
    this.contents = contents || null;
    return this;
  }

  setExtends(value) {
    this._extends = !!value;
    return this;
  }
  // endregion

  // region configuration/index

  noConfigurationSpecified() {
    return new DetoxConfigError({
      message: 'Cannot run Detox without a configuration file.',
      hint: _.endsWith(this.filepath, 'package.json')
        ? `Create an external .detoxrc.json configuration, or add "detox" configuration section to your package.json at:\n${this.filepath}`
        : 'Make sure to create external .detoxrc.json configuration in the working directory before you run Detox.'
    });
  }

  noConfigurationAtGivenPath(givenPath) {
    const message = this._extends
      ? `Failed to find the base Detox config specified in:\n{\n  "extends": ${J(givenPath)}\n}`
      : `Failed to find Detox config at ${J(givenPath)}`;

    const hint = this._extends
      ? `Check your Detox config${this._atPath()}`
      : 'Make sure the specified path is correct.';

    return new DetoxConfigError({ message, hint });
  }

  failedToReadConfiguration(unknownError) {
    return new DetoxConfigError({
      message: 'An error occurred while trying to load Detox config from:\n' + this.filepath,
      debugInfo: unknownError,
    });
  }

  noConfigurationsInside() {
    return new DetoxConfigError({
      message: `There are no configurations in the given Detox config${this._atPath()}`,
      hint: `Examine the config:`,
      debugInfo: this.contents ? {
        configurations: undefined,
        ...this.contents,
      } : {},
      inspectOptions: { depth: 1 },
    });
  }

  cantChooseConfiguration() {
    const configurations = this.contents.configurations;

    return new DetoxConfigError({
      message: `Cannot determine which configuration to use from Detox config${this._atPath()}`,
      hint: 'Use --configuration to choose one of the following:\n' + hintList(configurations),
    });
  }

  noConfigurationWithGivenName() {
    const configurations = this.contents.configurations;

    return new DetoxConfigError({
      message: `Failed to find a configuration named ${J(this.configurationName)} in Detox config${this._atPath()}`,
      hint: 'Below are the configurations Detox was able to find:\n' + hintList(configurations),
    });
  }

  configurationShouldNotBeEmpty() {
    const name = this.configurationName;
    const configurations = this.contents.configurations;

    return new DetoxConfigError({
      message: `Cannot use an empty configuration ${J(name)}.`,
      hint: `A valid configuration should have "device" and "app" properties defined, e.g.:\n
{
  "apps": {
*-->"myApp.ios": {
|     "type": "ios.app",
|     "binaryPath": "path/to/app"
|   },
| },
| "devices": {
|*->"simulator": {
||    "type": "ios.simulator",
||    "device": { type: "iPhone 12" }
||  },
||},
||"configurations": {
||  ${J(name)}: {
|*--- "device": "simulator",
*---- "app": "myApp.ios"
    }
  }
}
Examine your Detox config${this._atPath()}`,
      debugInfo: {
        configurations: {
          [name]: configurations[name],
          ...configurations,
        }
      },
      inspectOptions: { depth: 1 }
    });
  }

  // endregion

  // region composeDeviceConfig

  thereAreNoDeviceConfigs(deviceAlias) {
    return new DetoxConfigError({
      message: `Cannot use device alias ${J(deviceAlias)} since there is no "devices" config in Detox config${this._atPath()}`,
      hint: `\
You should create a dictionary of device configurations in Detox config, e.g.:
{
  "devices": {
*-> ${J(deviceAlias)}: {
|     "type": "ios.simulator", // or "android.emulator", or etc...
|     "device": { "type": "iPhone 12" }, // or e.g.: { "avdName": "Pixel_API_29" }
|   }
| },
| "configurations": {
|   ${J(this.configurationName)}: {
*---- "device": ${J(deviceAlias)},
      ...
    }
  }
}\n`,
    });
  }

  cantResolveDeviceAlias(alias) {
    return new DetoxConfigError({
      message: `Failed to find a device config ${J(alias)} in the "devices" dictionary of Detox config${this._atPath()}`,
      hint: 'Below are the device configurations Detox was able to find:\n'
        + hintList(this.contents.devices) + '\n\n'
        + `Check your configuration ${J(this.configurationName)}:`,
      debugInfo: this._getSelectedConfiguration(),
      inspectOptions: { depth: 0 },
    });
  }

  deviceConfigIsUndefined() {
    return new DetoxConfigError({
      message: `Missing "device" property in the selected configuration ${J(this.configurationName)}:`,
      hint: `It should be an alias to the device config, or the device config itself, e.g.:
{
  ...
  "devices": {
*-> "myDevice": {
|     "type": "ios.simulator", // or "android.emulator", or etc...
|     "device": { "type": "iPhone 12" }, // or e.g.: { "avdName": "Pixel_API_29" }
|   }
| },
| "configurations": {
|   ${J(this.configurationName)}: {
*---- "device": "myDevice", // or { type: 'ios.simulator', ... }
      ...
    },
    ...
  }
}

Examine your Detox config${this._atPath()}`,
    });
  }

  missingDeviceType(deviceAlias) {
    return new DetoxConfigError({
      message: `Missing "type" inside the device configuration.`,
      hint: `Usually, "type" property should hold the device type to test on (e.g. "ios.simulator" or "android.emulator").\n` +
        `Check that in your Detox config${this._atPath()}`,
      debugInfo: this._focusOnDeviceConfig(deviceAlias, this._ensureProperty('type')),
      inspectOptions: { depth: 3 },
    });
  }

  invalidDeviceType(deviceAlias, deviceConfig, innerError) {
    return new DetoxConfigError({
      message: `Invalid device type ${J(deviceConfig.type)} inside your configuration.`,
      hint: `Did you mean to use one of these?
${hintList(deviceAppTypes)}

P.S. If you intended to use a third-party driver, please resolve this error:

${innerError.message}

Please check your Detox config${this._atPath()}`,
      debugInfo: this._focusOnDeviceConfig(deviceAlias, this._ensureProperty('type')),
      inspectOptions: { depth: 3 },
    });
  }

  _invalidPropertyType(propertyName, expectedType, deviceAlias) {
    return new DetoxConfigError({
      message: `Invalid type of ${J(propertyName)} inside the device configuration.\n`
        + `Expected ${expectedType}.`,
      hint: `Check that in your Detox config${this._atPath()}`,
      debugInfo: this._focusOnDeviceConfig(deviceAlias),
      inspectOptions: { depth: 3 },
    });
  }

  _unsupportedPropertyByDeviceType(propertyName, supportedDeviceTypes, deviceAlias) {
    const { type } = this._getDeviceConfig(deviceAlias);

    return new DetoxConfigError({
      message: `The current device type ${J(type)} does not support ${J(propertyName)} property.`,
      hint: `You can use this property only with the following device types:\n` +
        hintList(supportedDeviceTypes) + '\n\n' +
        `Please fix your Detox config${this._atPath()}`,
      debugInfo: this._focusOnDeviceConfig(deviceAlias),
      inspectOptions: { depth: 4 },
    });
  }

  malformedDeviceProperty(deviceAlias, propertyName) {
    switch (propertyName) {
      case 'bootArgs':
        return this._invalidPropertyType('bootArgs', 'a string', deviceAlias);
      case 'utilBinaryPaths':
        return this._invalidPropertyType('utilBinaryPaths', 'an array of strings', deviceAlias);
      case 'forceAdbInstall':
        return this._invalidPropertyType('forceAdbInstall', 'a boolean value', deviceAlias);
      case 'gpuMode':
        return this._invalidPropertyType('gpuMode', "'auto' | 'host' | 'swiftshader_indirect' | 'angle_indirect' | 'guest'", deviceAlias);
      case 'headless':
        return this._invalidPropertyType('headless', 'a boolean value', deviceAlias);
      case 'readonly':
        return this._invalidPropertyType('readonly', 'a boolean value', deviceAlias);
      default:
        throw new DetoxInternalError(`Composing .malformedDeviceProperty(${propertyName}) is not implemented`);
    }
  }

  unsupportedDeviceProperty(deviceAlias, propertyName) {
    switch (propertyName) {
      case 'bootArgs':
        return this._unsupportedPropertyByDeviceType('bootArgs', ['ios.simulator', 'android.emulator'], deviceAlias);
      case 'forceAdbInstall':
        return this._unsupportedPropertyByDeviceType('forceAdbInstall', ['android.attached', 'android.emulator', 'android.genycloud'], deviceAlias);
      case 'gpuMode':
        return this._unsupportedPropertyByDeviceType('gpuMode', ['android.emulator'], deviceAlias);
      case 'headless':
        return this._unsupportedPropertyByDeviceType('headless', ['android.emulator'], deviceAlias);
      case 'readonly':
        return this._unsupportedPropertyByDeviceType('readonly', ['android.emulator'], deviceAlias);
      case 'utilBinaryPaths':
        return this._unsupportedPropertyByDeviceType('utilBinaryPaths', ['android.attached', 'android.emulator', 'android.genycloud'], deviceAlias);
      default:
        throw new DetoxInternalError(`Composing .unsupportedDeviceProperty(${propertyName}) is not implemented`);
    }
  }

  missingDeviceMatcherProperties(deviceAlias, expectedProperties) {
    const { type } = this._resolveSelectedDeviceConfig(deviceAlias);
    return new DetoxConfigError({
      message: `Invalid or empty "device" matcher inside the device config.`,
      hint: `It should have the device query to run on, e.g.:\n
{
  "type": ${J(type)},
  "device": ${expectedProperties.map(p => `{ ${J(p)}: ... }`).join('\n      // or ')}
}
Check that in your Detox config${this._atPath()}`,
      debugInfo: this._focusOnDeviceConfig(deviceAlias),
      inspectOptions: { depth: 4 },
    });
  }

  // endregion

  // region composeAppsConfig

  thereAreNoAppConfigs(appAlias) {
    return new DetoxConfigError({
      message: `Cannot use app alias ${J(appAlias)} since there is no "apps" config in Detox config${this._atPath()}`,
      hint: `\
You should create a dictionary of app configurations in Detox config, e.g.:
{
  "apps": {
*-> ${J(appAlias)}: {
|     "type": "ios.app", // or "android.apk", or etc...
|     "binaryPath": "path/to/your/app", // ... and so on
|   }
| },
| "configurations": {
|   ${J(this.configurationName)}: {
*---- "app": ${J(appAlias)},
      ...
    }
  }
}\n`,
    });
  }

  cantResolveAppAlias(appAlias) {
    return new DetoxConfigError({
      message: `Failed to find an app config ${J(appAlias)} in the "apps" dictionary of Detox config${this._atPath()}`,
      hint: 'Below are the app configurations Detox was able to find:\n' + hintList(this.contents.apps) +
        `\n\nCheck your configuration ${J(this.configurationName)}:`,
      debugInfo: this._getSelectedConfiguration(),
      inspectOptions: { depth: 1 },
    });
  }

  appConfigIsUndefined(appPath) {
    const appProperty = appPath[2] === 'apps'
      ? `"apps": [..., "myApp", ...]`
      : `"app": "myApp"`;

    return new DetoxConfigError({
      message: `Undefined or empty app config in the selected ${J(this.configurationName)} configuration:`,
      hint: `\
It should be an alias to an existing app config in "apps" dictionary, or the config object itself, e.g.:

{
  "apps": {
*-> "myApp": {
|     "type": "ios.app", // or "android.apk", or etc...
|     "binaryPath": "path/to/your/app", // ... and so on
|   }
| },
| "configurations": {
|   ${J(this.configurationName)}: {
*---- ${appProperty}
      ...
    }
  }
Examine your Detox config${this._atPath()}`,
      debugInfo: this._focusOnConfiguration(),
      inspectOptions: { depth: 2 }
    });
  }

  malformedAppLaunchArgs(appPath) {
    return new DetoxConfigError({
      message: `Invalid type of "launchArgs" property ${this._inTheAppConfig()}.\nExpected an object:`,
      debugInfo: this._focusOnAppConfig(appPath),
      inspectOptions: { depth: 4 },
    });
  }

  missingAppBinaryPath(appPath) {
    return new DetoxConfigError({
      message: `Missing "binaryPath" property ${this._inTheAppConfig()}.\nExpected a string:`,
      debugInfo: this._focusOnAppConfig(appPath, this._ensureProperty('binaryPath')),
      inspectOptions: { depth: 4 },
    });
  }

  invalidAppType({ appPath, allowedAppTypes, deviceType }) {
    return new DetoxConfigError({
      message: `Invalid app "type" property in the app config.\nExpected ${allowedAppTypes.map(J).join(' or ')}.`,
      hint: `\
You have a few options:
1. Replace the value with the suggestion.
2. Use a correct device type with this app config. Currently you have ${J(deviceType)}.`,
      debugInfo: this._focusOnAppConfig(appPath),
      inspectOptions: { depth: 4 },
    });
  }

  duplicateAppConfig({ appName, appPath, preExistingAppPath }) {
    const config1 = { ..._.get(this.contents, preExistingAppPath) };
    config1.name = config1.name || '<GIVE IT A NAME>';
    const config2 = { ..._.get(this.contents, appPath) };
    config2.name = '<GIVE IT ANOTHER NAME>';

    const name = this.configurationName;
    const hintMessage = appName
      ? `Both apps use the same name ${J(appName)} — try giving each app a unique name.`
      : `The app configs are missing "name" property that serves to distinct them.`;

    return new DetoxConfigError({
      message: `App collision detected in the selected configuration ${J(name)}.`,
      hint: `\
${hintMessage}

detox → ${preExistingAppPath.join(' → ')}:
${DetoxConfigError.inspectObj(config1, { depth: 0 })}

detox → ${appPath.join(' → ')}:
${DetoxConfigError.inspectObj(config2, { depth: 0 })}

Examine your Detox config${this._atPath()}`,
    });
  }

  noAppIsDefined(deviceType) {
    const name = this.configurationName;
    const [appType] = deviceAppTypes[deviceType] || [''];
    const [appPlatform] = appType.split('.');
    const appAlias = appType ? `myApp.${appPlatform}` : 'myApp';

    return new DetoxConfigError({
      message: `The ${J(name)} configuration has no defined "app" config.`,
      hint: `There should be an inlined object or an alias to the app config, e.g.:\n
{
  "apps": {
*-->"${appAlias}": {
|     "type": "${appType || 'someAppType'}",
|     "binaryPath": "path/to/app"
|   },
| },
| "configurations": {
|   ${J(name)}: {
*---- "app": "${appAlias}"
      ...
    }
  }
}

Examine your Detox config${this._atPath()}`,
      debugInfo: this._focusOnConfiguration(),
      inspectOptions: { depth: 0 }
    });
  }

  oldSchemaHasAppAndApps() {
    return new DetoxConfigError({
      message: `Your configuration ${J(this.configurationName)} appears to be in a legacy format, which can’t contain "app" or "apps".`,
      hint: `Remove "type" property from configuration and use "device" property instead:\n` +
        `a) "device": { "type": ${J(this._getSelectedConfiguration().type)}, ... }\n` +
        `b) "device": "<alias-to-device>" // you should add that device configuration to "devices" with the same key` +
        `\n\nCheck your Detox config${this._atPath()}`,
      debugInfo: this._focusOnConfiguration(this._ensureProperty('type', 'device')),
      inspectOptions: { depth: 2 },
    });
  }

  ambiguousAppAndApps() {
    return new DetoxConfigError({
      message: `You can't have both "app" and "apps" defined in the ${J(this.configurationName)} configuration.`,
      hint: 'Use "app" if you have a single app to test.' +
        '\nUse "apps" if you have multiple apps to test.' +
        `\n\nCheck your Detox config${this._atPath()}`,
      debugInfo: this._focusOnConfiguration(this._ensureProperty('app', 'apps')),
      inspectOptions: { depth: 2 },
    });
  }

  multipleAppsConfigArrayTypo() {
    return new DetoxConfigError({
      message: `Invalid type of the "app" property in the selected configuration ${J(this.configurationName)}.`,
      hint: 'Rename "app" to "apps" if you plan to work with multiple apps.' +
        `\n\nCheck your Detox config${this._atPath()}`,
      debugInfo: this._focusOnConfiguration(this._ensureProperty('app')),
      inspectOptions: { depth: 2 },
    });
  }

  multipleAppsConfigShouldBeArray() {
    return new DetoxConfigError({
      message: `Expected an array in "apps" property in the selected configuration ${J(this.configurationName)}.`,
      hint: 'Rename "apps" to "app" if you plan to work with a single app.' +
        '\nOtherwise, make sure "apps" contains a valid array of app aliases or inlined app configs.' +
        `\n\nCheck your Detox config${this._atPath()}`,
      debugInfo: this._focusOnConfiguration(this._ensureProperty('apps')),
      inspectOptions: { depth: 3 },
    });
  }

  // endregion

  // region composeSessionConfig

  invalidServerProperty() {
    return new DetoxConfigError({
      message: `session.server property is not a valid WebSocket URL`,
      hint: `Expected something like "ws://localhost:8099".\nCheck that in your Detox config${this._atPath()}`,
      inspectOptions: { depth: 3 },
      debugInfo: _.omitBy({
        session: _.get(this.contents, ['session']),
        ...this._focusOnConfiguration(c => _.pick(c, ['session'])),
      }, _.isEmpty),
    });
  }

  invalidSessionIdProperty() {
    return new DetoxConfigError({
      message: `session.sessionId property should be a non-empty string`,
      hint: `Check that in your Detox config${this._atPath()}`,
      inspectOptions: { depth: 3 },
      debugInfo: _.omitBy({
        session: _.get(this.contents, ['session']),
        ...this._focusOnConfiguration(c => _.pick(c, ['session'])),
      }, _.isEmpty),
    });
  }

  invalidDebugSynchronizationProperty() {
    return new DetoxConfigError({
      message: `session.debugSynchronization should be a positive number`,
      hint: `Check that in your Detox config${this._atPath()}`,
      inspectOptions: { depth: 3 },
      debugInfo: _.omitBy({
        session: _.get(this.contents, ['session']),
        ...this._focusOnConfiguration(c => _.pick(c, ['session'])),
      }, _.isEmpty),
    });
  }

  // endregion

  missingBuildScript(appConfig) {
    return new DetoxConfigError({
      message: `\
Failed to build the app for the configuration ${J(this.configurationName)}, because \
there was no "build" script inside.
Check contents of your Detox config${this._atPath()}`,
      debugInfo: { build: undefined, ...appConfig },
      inspectOptions: { depth: 0 },
    });
  }
}

function hintList(items) {
  const values = Array.isArray(items) ? items : _.keys(items);
  return values.map(c => `* ${c}`).join('\n');
}

module.exports = DetoxConfigErrorComposer;
