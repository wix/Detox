jest.mock('./runtime/drivers/ios/IosDriver');
jest.mock('./runtime//drivers/ios/SimulatorDriver');
jest.mock('./runtime//drivers/android/emulator/EmulatorDriver');
jest.mock('./runtime//drivers/android/attached/AttachedAndroidDriver');
jest.mock('../utils/resolveModuleFromPath');

describe('DriverRegistry', () => {
  let DriverRegistry;
  let registry;

  beforeEach(() => {
    DriverRegistry = require('./DriverRegistry');
  });

  describe('by default', () => {
    beforeEach(() => {
      registry = DriverRegistry.default;
    });

    it('should resolve "ios.none" to IosDriver', () => {
      const IosDriver = require('./runtime/drivers/ios/IosDriver');
      const ResolvedDriver = registry.resolve('ios.none');

      expect(ResolvedDriver).toBe(IosDriver);
    });

    it('should resolve "ios.simulator" to SimulatorDriver', () => {
      const SimulatorDriver = require('./runtime/drivers/ios/SimulatorDriver');
      const ResolvedDriver = registry.resolve('ios.simulator');

      expect(ResolvedDriver).toBe(SimulatorDriver);
    });

    it('should resolve "android.attached" to AttachedAndroidDriver', () => {
      const AttachedAndroidDriver = require('./runtime/drivers/android/attached/AttachedAndroidDriver');
      const ResolvedDriver = registry.resolve('android.attached');

      expect(ResolvedDriver).toBe(AttachedAndroidDriver);
    });

    it('should resolve "android.emulator" to EmulatorDriver', () => {
      const EmulatorDriver = require('./runtime/drivers/android/emulator/EmulatorDriver');
      const ResolvedDriver = registry.resolve('android.emulator');

      expect(ResolvedDriver).toBe(EmulatorDriver);
    });

    it('should try to resolve unknown driver as a node.js dependency', () => {
      require('../utils/resolveModuleFromPath').mockImplementation(() => {
        return {
          DriverClass: require('./runtime/drivers/__mocks__/FakeDriver'),
        };
      });

      const FakeDriver = require('./runtime/drivers/__mocks__/FakeDriver');
      const ResolvedDriver = registry.resolve('fake-driver');

      expect(ResolvedDriver).toBe(FakeDriver);
    });

    it('should throw an error if a custom driver does not export DriverClass property', () => {
      require('../utils/resolveModuleFromPath').mockImplementation(() => {
        return require('./runtime/drivers/__mocks__/FakeDriver');
      });

      expect(() => registry.resolve('fake-driver')).toThrowError(/does not export DriverClass/);
    });

    it('should throw errors if it cannot resolve a driver', () => {
      require('../utils/resolveModuleFromPath').mockImplementation(() => { throw new Error('BAD IDEA'); });
      expect(() => registry.resolve('imaginary.driver')).toThrowError('BAD IDEA');
    });
  });

  describe('constructor', () => {
    it('should be extensible', () => {
      const FakeDriver101 = require('./runtime/drivers/__mocks__/FakeDriver');
      const registry = new DriverRegistry({ FakeDriver101 });
      const driver = registry.resolve('FakeDriver101');

      expect(driver).toBe(FakeDriver101);
    });
  });
});
