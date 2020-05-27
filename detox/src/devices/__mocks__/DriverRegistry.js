const DriverRegistry = jest.requireActual('../DriverRegistry');
const FakeDriver = jest.requireActual('../drivers/__mocks__/FakeDriver');

class FakeDriverRegistry extends DriverRegistry {
  constructor(...args) {
    super(...args);
    jest.spyOn(this, 'resolve');
  }
}

FakeDriverRegistry.FakeDriver = FakeDriver;
FakeDriverRegistry.default = new FakeDriverRegistry({
  'fake.device': FakeDriver,
});

module.exports = FakeDriverRegistry;