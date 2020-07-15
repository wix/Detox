jest.mock('./drivers/ios/IosDriver');
jest.mock('./drivers/ios/SimulatorDriver');
jest.mock('./drivers/android/EmulatorDriver');
jest.mock('./drivers/android/AttachedAndroidDriver');
jest.mock('../utils/resolveModuleFromPath');

describe('DriverRegistry', () => {
  let DriverRegistry;
  let registry, opts;

  beforeEach(() => {
    DriverRegistry = require('./DriverRegistry');

    opts = {
      client: { whatever: Math.random() },
      emitter: { anything: Math.random() },
    };
  });

  describe('by default', () => {
    beforeEach(() => {
      registry = DriverRegistry.default;
    });

    it('should resolve "ios.none" to IosDriver', () => {
      const IosDriver = require('./drivers/ios/IosDriver');
      const driver = registry.resolve('ios.none', opts);

      expect(driver).toBeInstanceOf(IosDriver);
      expect(IosDriver).toHaveBeenCalledWith(opts);
    });

    it('should resolve "ios.simulator" to SimulatorDriver', () => {
      const SimulatorDriver = require('./drivers/ios/SimulatorDriver');
      const driver = registry.resolve('ios.simulator', opts);

      expect(driver).toBeInstanceOf(SimulatorDriver);
      expect(SimulatorDriver).toHaveBeenCalledWith(opts);
    });

    it('should resolve "android.attached" to AttachedAndroidDriver', () => {
      const AttachedAndroidDriver = require('./drivers/android/AttachedAndroidDriver');
      const driver = registry.resolve('android.attached', opts);

      expect(driver).toBeInstanceOf(AttachedAndroidDriver);
      expect(AttachedAndroidDriver).toHaveBeenCalledWith(opts);
    });

    it('should resolve "android.emulator" to EmulatorDriver', () => {
      const EmulatorDriver = require('./drivers/android/EmulatorDriver');
      const driver = registry.resolve('android.emulator', opts);

      expect(driver).toBeInstanceOf(EmulatorDriver);
      expect(EmulatorDriver).toHaveBeenCalledWith(opts);
    });

    it('should try to resolve unknown driver as a node.js dependency', () => {
      require('../utils/resolveModuleFromPath').mockImplementation(() => {
        return {
          DriverClass: require('./drivers/__mocks__/FakeDriver'),
        };
      });

      const FakeDriver = require('./drivers/__mocks__/FakeDriver');
      const driver = registry.resolve('fake-driver', opts);

      expect(driver).toBeInstanceOf(FakeDriver);
      expect(driver.constructorArgs).toEqual([opts]);
    });

    it('should throw errors if it cannot resolve a driver', () => {
      expect(() => registry.resolve('imaginary.driver', opts))
        .toThrowError(/imaginary.driver.*not supported/);
    });
  });

  describe('constructor', () => {
    it('should be extensible', () => {
      const FakeDriver101 = require('./drivers/__mocks__/FakeDriver');
      const registry = new DriverRegistry({ FakeDriver101 });
      const driver = registry.resolve('FakeDriver101', opts);

      expect(driver).toBeInstanceOf(FakeDriver101);
      expect(driver.constructorArgs).toEqual([opts]);
    });
  });
});
