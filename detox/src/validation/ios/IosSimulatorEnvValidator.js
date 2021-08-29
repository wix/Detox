const fs = require('fs');

const EnvironmentValidatorBase = require('../EnvironmentValidatorBase');
const DetoxRuntimeError = require('../../errors/DetoxRuntimeError');

class IosSimulatorEnvValidator extends EnvironmentValidatorBase {
  constructor(detoxFrameworkPath) {
    super();
    this._detoxFrameworkPath = detoxFrameworkPath;
  }

  validate() {
    if (!this._frameworkPathExists()) {
      throw new DetoxRuntimeError(`${this._detoxFrameworkPath} could not be found, this means either you changed a version of Xcode or Detox postinstall script was unsuccessful.
        To attempt a fix try running 'detox clean-framework-cache && detox build-framework-cache'`);
    }
  }

  _frameworkPathExists() {
    return fs.existsSync(this._detoxFrameworkPath);
  }
}

module.exports = IosSimulatorEnvValidator;
