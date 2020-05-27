const _ = require('lodash');
const DetoxConfigError = require('./DetoxConfigError');

class DetoxConfigErrorBuilder {
  constructor() {
    this.setDetoxConfigPath();
    this.setDetoxConfig();
    this.setConfigurationName();
  }

  setDetoxConfigPath(filepath) {
    this.filepath = filepath || '';
    return this;
  }

  setDetoxConfig(contents) {
    this.contents = contents || null;
    return this;
  }

  setConfigurationName(configurationName) {
    this.configurationName = configurationName || '';
    return this;
  }

  noConfigurationSpecified() {
    return new DetoxConfigError({
      message: 'Cannot run Detox without a configuration.',
      hint: this.filepath.endsWith('package.json')
        ? `Create an external .detoxrc.json configuration, or add "detox" configuration section to your package.json at:\n${this.filepath}`
        : 'Make sure to create external .detoxrc.json configuration in the working directory before you run Detox.'
    });
  }

  noConfigurationAtGivenPath() {
    return new DetoxConfigError({
      message: 'Failed to find Detox config at:\n' + this.filepath,
      hint: 'Make sure the specified path is correct.',
    });
  }

  failedToReadConfiguration(unknownError) {
    return new DetoxConfigError({
      message: 'An error occurred while trying to load Detox config from:\n' + this.filepath,
      debugInfo: unknownError && unknownError.message,
    });
  }

  noDeviceConfigurationsInside() {
    return new DetoxConfigError({
      message: `There are no device configurations in the given Detox config.`,
      hint: this.filepath && `Examine the config at: ${this.filepath}`,
      debugInfo: {
        configurations: undefined,
        ...this.contents,
      },
      inspectOptions: { depth: 1 },
    });
  }

  cantChooseDeviceConfiguration() {
    const configurations = this.contents.configurations;

    return new DetoxConfigError({
      message: `Cannot determine which configuration to use from Detox config${_atPath(this.filepath)}`,
      hint: 'Use --configuration to choose one of the following:\n' + hintConfigurations(configurations),
    });
  }

  noDeviceConfigurationWithGivenName() {
    const configurations = this.contents.configurations;

    return new DetoxConfigError({
      message: `Failed to find a configuration named "${this.configurationName}" in Detox config${_atPath(this.filepath)}`,
      hint: 'Below are the configurations Detox was able to find:\n' + hintConfigurations(configurations),
    });
  }

  missingConfigurationType() {
    return new DetoxConfigError({
      message:
        `Missing "type" inside detox.configurations["${this.configurationName}"].\n` +
        `Usually, "type" property should hold the device type to test on (e.g. "ios.simulator" or "android.emulator").`,
      hint: `Check that in your Detox config${_atPath(this.filepath)}`,
      debugInfo: this._focusOnConfiguration(),
      inspectOptions: { depth: 2 },
    });
  }

  missingDeviceProperty() {
    return new DetoxConfigError({
      message: `Missing or empty "device" property inside detox.configurations["${this.configurationName}"].\n` +
        `It should hold the device query to run on (e.g. { "type": "iPhone 11 Pro" }, { "avdName": "Nexus_5X_API_29" }).`,
      hint: `Check that in your Detox config${_atPath(this.filepath)}`,
      debugInfo: this._focusOnConfiguration(),
      inspectOptions: { depth: 2 },
    });
  }

  missingServerProperty() {
    return new DetoxConfigError({
      message: `session.server property is missing, should hold the server address`,
      hint: `Check that in your Detox config${_atPath(this.filepath)}`,
      inspectOptions: { depth: 3 },
      debugInfo: _.omitBy({
        session: _.get(this.contents, ['session']),
        ...this._focusOnConfiguration(c => _.pick(c, ['session'])),
      }, _.isEmpty),
    });
  }

  missingSessionIdProperty() {
    return new DetoxConfigError({
      message: `session.sessionId property is missing, should hold the server session id`,
      hint: `Check that in your Detox config${_atPath(this.filepath)}`,
      inspectOptions: { depth: 3 },
      debugInfo: _.omitBy({
        session: _.get(this.contents, ['session']),
        ...this._focusOnConfiguration(c => _.pick(c, ['session'])),
      }, _.isEmpty),
    });
  }

  missingBuildScript() {
    return new DetoxConfigError({
      message: `Could not find a build script inside "${this.configurationName}" configuration.`,
      hint: `Check contents of your Detox config${_atPath(this.filepath)}`,
      debugInfo: this._focusOnConfiguration(),
      inspectOptions: { depth: 2 },
    });
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
}

function hintConfigurations(configurations) {
  return _.keys(configurations).map(c => `* ${c}`).join('\n')
}

function _atPath(configPath) {
  return configPath ? ` at path:\n${configPath}` : '.';
}

module.exports = DetoxConfigErrorBuilder;
