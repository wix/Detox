const DriverRegistry = jest.requireActual('../DriverRegistry');
const DeviceDriverBase = jest.requireActual('../drivers/DeviceDriverBase');

class FakeDriverRegistry extends DriverRegistry {
  constructor(...args) {
    super(...args);
    jest.spyOn(this, 'resolve');
  }
}

class FakeDriver extends DeviceDriverBase {
  constructor(...args) {
    super(...args);
    this.matchers = FakeDriver.matchers;
  }

  declareArtifactPlugins() {
    return FakeDriver.artifactsPlugins;
  }
}

FakeDriver.matchers = {};
FakeDriver.artifactsPlugins = {};
FakeDriverRegistry.FakeDriver = FakeDriver;
FakeDriverRegistry.default = new FakeDriverRegistry({
  'fake.device': FakeDriver,
});

module.exports = FakeDriverRegistry;