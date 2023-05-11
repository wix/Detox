const fs = require('fs');

const DetoxRuntimeError = require('../../errors/DetoxRuntimeError');
const environment = require('../../utils/environment');
const EnvironmentValidatorBase = require('../EnvironmentValidatorBase');

class IosSimulatorEnvValidator extends EnvironmentValidatorBase {
  async validate() {
    const detoxFrameworkPath = await environment.getFrameworkPath();

    if (!fs.existsSync(detoxFrameworkPath)) {
      throw new DetoxRuntimeError(`${detoxFrameworkPath} could not be found, this means either you changed a version of Xcode or Detox postinstall script was unsuccessful.
        To attempt a fix try running 'detox clean-framework-cache && detox build-framework-cache'`);
    }

    const detoxXCUITestRunnerPath = await environment.getXCUITestRunnerPath();

    if (!fs.existsSync(detoxXCUITestRunnerPath)) {
      throw new DetoxRuntimeError(`${detoxXCUITestRunnerPath} could not be found, this means either you changed a version of Xcode or Detox postinstall script was unsuccessful.
        To attempt a fix try running 'detox clean-xcuitest-cache && detox build-xcuitest-cache'`);
    }
  }
}

module.exports = IosSimulatorEnvValidator;
