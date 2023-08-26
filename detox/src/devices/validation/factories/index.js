class EnvValidatorFactory {
  createValidator() {}
}

class Genycloud extends EnvValidatorFactory {
  createValidator() {
    const serviceLocator = require('../../servicelocator/android');
    const exec = serviceLocator.genycloud.exec;

    const GenyAuthService = require('../../allocation/drivers/android/genycloud/services/GenyAuthService');
    const authService = new GenyAuthService(exec);

    const GenycloudEnvValidator = require('../android/GenycloudEnvValidator');
    return new GenycloudEnvValidator({ authService, exec });
  }
}

class IosSimulator extends EnvValidatorFactory {
  createValidator() {
    const IosSimulatorEnvValidator = require('../ios/IosSimulatorEnvValidator');
    return new IosSimulatorEnvValidator();
  }
}

class Noop extends EnvValidatorFactory {
  createValidator() {
    const EnvironmentValidatorBase = require('../EnvironmentValidatorBase');
    return new EnvironmentValidatorBase();
  }
}

class External extends EnvValidatorFactory {
  constructor(module) {
    super();
    this._module = module;
  }

  createValidator() {
    if (this._module.EnvironmentValidatorClass) {
      return new this._module.EnvironmentValidatorClass();
    }
    return new Noop().createValidator();
  }
}

module.exports = {
  Genycloud,
  IosSimulator,
  Noop,
  External,
};
