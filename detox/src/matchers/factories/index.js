class MatchersFactory {
  createMatchers() {}
}

class AndroidMatchersFactory extends MatchersFactory {
  createMatchers({ invocationManager, runtimeDevice, eventEmitter }) {
    const AndroidExpect = require('../../android/AndroidExpect');
    return new AndroidExpect({ invocationManager, device: runtimeDevice, emitter: eventEmitter });
  }
}

class IosMatchersFactory extends MatchersFactory {
  createMatchers({ invocationManager, eventEmitter }) {
    const IosExpect = require('../../ios/expectTwo');
    return new IosExpect({ invocationManager, emitter: eventEmitter });
  }
}

module.exports = {
  AndroidMatchersFactory,
  IosMatchersFactory,
};
