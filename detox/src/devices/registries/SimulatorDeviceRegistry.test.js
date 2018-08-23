jest.mock('../ios/AppleSimUtils');
const _ = require('lodash');
const SimulatorDeviceRegistry = require('./SimulatorDeviceRegistry');

describe('SimulatorDeviceRegistry', () => {
  let applesimutils;
  let registry;

  beforeEach(() => {
    const AppleSimUtils = require('../ios/AppleSimUtils');
    applesimutils = new AppleSimUtils();

    registry = new SimulatorDeviceRegistry(applesimutils);
  });

  describe('acquireDeviceWithName', () => {
    beforeEach(() => {
      registry.acquireDevice = jest.fn();
    });

    it('should convert string to { name }', async () => {
      await registry.acquireDeviceWithName('iPhone X');
      expect(registry.acquireDevice).toHaveBeenCalledWith({ name: 'iPhone X' });
    });

    it('should convert string,string to { name, os: { version } }', async () => {
      await registry.acquireDeviceWithName('iPhone X, iOS 11.4');

      expect(registry.acquireDevice).toHaveBeenCalledWith({
        deviceType: { name: 'iPhone X' },
        os: { version: 'iOS 11.4' }
      });
    });
  });

  describe('createDeviceWithProperties', () => {
    it('should call apple sim utils: .create()', async () => {
      const params = {};

      applesimutils.createDeviceWithProperties.mockReturnValue("UDID");
      expect(await registry.createDeviceWithProperties(params)).toBe("UDID");
      expect(applesimutils.createDeviceWithProperties).toHaveBeenCalledWith(params);
    });

    it('should call apple sim utils: .getDevicesWithProperties()', async () => {
      const params = {};

      applesimutils.getDevicesWithProperties.mockReturnValue(['test']);
      expect(await registry.getDevicesWithProperties(params)).toEqual(['test']);
      expect(applesimutils.getDevicesWithProperties).toHaveBeenCalledWith(params);
    });
  });

  describe('getRuntimeVersion', () => {
    beforeEach(() => {
      registry = new SimulatorDeviceRegistry(null);
    });

    function withVersion(version) {
      return { os: { version }};
    }

    it('should return 0 from undefined', () => {
      expect(registry.getRuntimeVersion(withVersion())).toBe(0);
    });

    it('should return 5-6 digit number from strings', () => {
      const ascending =
        ['0', '9', '9.1.1', '11', '11.3', '11.4.1', '11.4.10', '11.10.1', '11.10.10'].map(withVersion);

      const shuffled = _.shuffle(ascending);
      const sorted = _.sortBy(shuffled, registry.getRuntimeVersion);

      expect(sorted).toEqual(ascending);
    });
  });
});
