const DetoxRuntimeError = require('../../errors/DetoxRuntimeError');

class MatchersFactoryBase {
  createMatchers() {}
}

class AndroidFactory extends MatchersFactoryBase {
  createMatchers({ invocationManager, runtimeDevice, eventEmitter }) {
    const AndroidExpect = require('../../android/AndroidExpect');
    return new AndroidExpect({ invocationManager, device: runtimeDevice, emitter: eventEmitter });
  }
}

class IosFactory extends MatchersFactoryBase {
  createMatchers({ invocationManager, eventEmitter }) {
    const IosExpect = require('../../ios/expectTwo');
    return new IosExpect({ invocationManager, emitter: eventEmitter });
  }
}

class ExternalFactory extends MatchersFactoryBase {
  static validateConfig(module, path) {
    if (!module.ExpectClass) {
      throw new DetoxRuntimeError(`The custom driver at '${path}' does not export the ExpectClass property`);
    }
  }

  constructor(module, path) {
    super();
    ExternalFactory.validateConfig(module, path);

    this._module = module;
  }

  createMatchers(deps) {
    return new this._module.ExpectClass(deps);
  }
}

module.exports = {
  AndroidFactory,
  IosFactory,
  ExternalFactory,
};
