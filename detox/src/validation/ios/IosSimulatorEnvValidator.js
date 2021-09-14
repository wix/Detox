const fs = require('fs');
const environment = require('../../utils/environment');

const EnvironmentValidatorBase = require('../EnvironmentValidatorBase');
const DetoxRuntimeError = require('../../errors/DetoxRuntimeError');

class IosSimulatorEnvValidator extends EnvironmentValidatorBase {
  async validate() {
    const detoxFrameworkPath = await environment.getFrameworkPath();

    if (!this._frameworkPathExists(detoxFrameworkPath)) {
      throw new DetoxRuntimeError(`${detoxFrameworkPath} could not be found, this means either you changed a version of Xcode or Detox postinstall script was unsuccessful.
        To attempt a fix try running 'detox clean-framework-cache && detox build-framework-cache'`);
    }
  }

  _frameworkPathExists(detoxFrameworkPath) {
    return fs.existsSync(detoxFrameworkPath);
  }
}

module.exports = IosSimulatorEnvValidator;
