const DetoxRuntimeError = require('../../errors/DetoxRuntimeError');

class MatchersFactory {
  createMatchers() {}
}

class Android extends MatchersFactory {
  createMatchers({ invocationManager, runtimeDevice, eventEmitter }) {
    const AndroidExpect = require('../../android/AndroidExpect');
    return new AndroidExpect({ invocationManager, device: runtimeDevice, emitter: eventEmitter });
  }
}

class Ios extends MatchersFactory {
  createMatchers({ invocationManager, eventEmitter }) {
    const IosExpect = require('../../ios/expectTwo');
    return new IosExpect({ invocationManager, emitter: eventEmitter });
  }
}

class External extends MatchersFactory {
  static validateModule(module, path) {
    if (!module.ExpectClass) {
      throw new DetoxRuntimeError(`The custom driver at '${path}' does not export the ExpectClass property`);
    }
  }

  constructor(module, path) {
    super();
    External.validateModule(module, path);

    this._module = module;
  }

  createMatchers(deps) {
    return new this._module.ExpectClass(deps);
  }
}

module.exports = {
  Android,
  Ios,
  External,
};
