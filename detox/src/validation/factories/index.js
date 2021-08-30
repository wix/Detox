const environment = require('../../utils/environment');

class EnvironmentValidatorFactory {
  createValidator() {}
}

class GenycloudEnvValidatorFactory extends EnvironmentValidatorFactory {
  createValidator() {
    const serviceLocator = require('../../servicelocator/android');
    const exec = serviceLocator.genycloud.exec();

    const GenyAuthService = require('../../devices/common/drivers/android/genycloud/services/GenyAuthService');
    const authService = new GenyAuthService(exec);

    const GenycloudEnvValidator = require('../android/GenycloudEnvValidator');
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
