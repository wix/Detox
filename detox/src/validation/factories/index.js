const environment = require('../../utils/environment');

class EnvironmentValidatorFactory {
  createValidator() {}
}

class GenycloudEnvValidatorFactory extends EnvironmentValidatorFactory {
  createValidator() {
    const GenyExec = require('../../devices/common/drivers/android/genycloud/exec/GenyCloudExec');
    const GenyAuthService = require('../../devices/common/drivers/android/genycloud/services/GenyAuthService');
    const GenycloudEnvValidator = require('../android/GenycloudEnvValidator');

    const exec = new GenyExec(environment.getGmsaasPath());
    const authService = new GenyAuthService(exec);
    return new GenycloudEnvValidator({ authService, exec });
  }
}

class IosSimulatorEnvValidatorFactory extends EnvironmentValidatorFactory {
  async createValidator() {
    const IosSimulatorEnvValidator = require('../ios/IosSimulatorEnvValidator');
    return new IosSimulatorEnvValidator(await environment.getFrameworkPath());
  }
}

class NoopEnvValidatorFactory extends EnvironmentValidatorFactory {
  createValidator() {
    const EnvironmentValidatorBase = require('../EnvironmentValidatorBase');
    return new EnvironmentValidatorBase();
  }
}

module.exports = {
  GenycloudEnvValidatorFactory,
  IosSimulatorEnvValidatorFactory,
  NoopEnvValidatorFactory,
};
