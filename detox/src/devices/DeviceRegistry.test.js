const DeviceRegistry = require('./DeviceRegistry');

describe('DeviceRegistry', () => {
  let registry;
  let createDevice = jest.fn();
  let getDeviceIdsByType = jest.fn();

  function mockDeviceList(type, length) {
    const devicesIds = Array.from(Array(length).keys());
    return devicesIds.map(deviceId => `id-${deviceId}-of-type-${type}`);
  }

  beforeEach(() => {
    createDevice = jest.fn();
    getDeviceIdsByType = jest.fn();
    registry = new DeviceRegistry({getDeviceIdsByType, createDevice});
    registry.clear();
  });

  describe(`create device`, () => {

    it(`should create device if there's no device available`, async () => {
      getDeviceIdsByType.mockReturnValue([]);

      await registry.getDevice('iPhone X');

      expect(createDevice).toHaveBeenCalledTimes(1);
      expect(createDevice).toHaveBeenCalledWith('iPhone X');
    });

    it(`should not create device if there's no device available`, async () => {
      getDeviceIdsByType.mockReturnValue(mockDeviceList('iPhone X', 1));

      await registry.getDevice('iPhone X');

      expect(createDevice).toHaveBeenCalledTimes(0);
    });

    it(`should create device if all available devices are busy`, async () => {
      getDeviceIdsByType.mockReturnValue(mockDeviceList('iPhone X', 1));

      await registry.getDevice('iPhone X');
      await registry.getDevice('iPhone X');

      expect(createDevice).toHaveBeenCalledTimes(1);
    });
  });

  describe('free device', () => {
    it('should free device', async () => {
      const deviceList = mockDeviceList('iPhone X', 1);
      const deviceId = deviceList[0];
      getDeviceIdsByType.mockReturnValue(deviceList);

      await registry.getDevice('iPhoneX');
      expect(await registry.isBusy(deviceId)).toBe(true);

      await registry.freeDevice(deviceId);
      expect(await registry.isBusy(deviceId)).toBe(false);
    });
  });
});