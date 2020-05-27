const DeviceDriverBase = require('../DeviceDriverBase');

class FakeDriver extends DeviceDriverBase {
  constructor(...args) {
    super(...args);

    this.constructorArgs = args;
    this.matchers = FakeDriver.matchers;
  }

  declareArtifactPlugins() {
    return FakeDriver.artifactsPlugins;
  }
}

FakeDriver.matchers = {};
FakeDriver.artifactsPlugins = {};

module.exports = FakeDriver;
