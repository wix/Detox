const environment = require('../../utils/environment');

class EnvironmentValidatorFactoryBase {
  createValidator() {}
}

class GenycloudFactory extends EnvironmentValidatorFactoryBase {
  createValidator() {
    const serviceLocator = require('../../servicelocator/android');
    const exec = serviceLocator.genycloud.exec();

    const GenyAuthService = require('../../devices/common/drivers/android/genycloud/services/GenyAuthService');
    const authService = new GenyAuthService(exec);

    const GenycloudEnvValidator = require('../android/GenycloudEnvValidator');
    return new GenycloudEnvValidator({ authService, exec });
  }
}

class IosSimulatorFactory extends EnvironmentValidatorFactoryBase {
  async createValidator() {
    const IosSimulatorEnvValidator = require('../ios/IosSimulatorEnvValidator');
    return new IosSimulatorEnvValidator(await environment.getFrameworkPath());
  }
}

class NoopFactory extends EnvironmentValidatorFactoryBase {
  createValidator() {
    const EnvironmentValidatorBase = require('../EnvironmentValidatorBase');
    return new EnvironmentValidatorBase();
  }
}

class ExternalFactory extends EnvironmentValidatorFactoryBase {
  constructor(module) {
    super();
    this._module = module;
  }

  createValidator() {
    if (this._module.EnvironmentValidatorClass) {
      return new this._module.EnvironmentValidatorClass();
    }
    return new NoopFactory().createValidator();
  }
}

module.exports = {
  GenycloudFactory,
  IosSimulatorFactory,
  NoopFactory,
  ExternalFactory,
};
