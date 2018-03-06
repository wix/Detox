const DeviceRegistry = require('./DeviceRegistry');

describe('device registry', () => {

  let registry;
  const createDevice = jest.fn();

  function initRegistry({maxTestRunners, numberOfDevicesPerType = 1} = {}) {
    const devicesIds = Array.from(Array(numberOfDevicesPerType).keys());
    const getDeviceIdsByType = type => devicesIds.map(deviceId => `id-${deviceId}-of-type-${type}`);
    return new DeviceRegistry({getDeviceIdsByType, maxTestRunners, createDevice});
  }

  describe('device creation', () => {

    it('should create devices if they are not available', async () => {
      const maxTestRunners = 4;
      const numberOfDevicesPerType = 1;

      registry = initRegistry({maxTestRunners, numberOfDevicesPerType});
      await registry.getDevice('iPhoneX');

      expect(createDevice).toHaveBeenCalledTimes(maxTestRunners - numberOfDevicesPerType);
      expect(createDevice).toHaveBeenCalledWith('iPhoneX');
    });

    it('should not create devices if there is no need', async () => {
      const maxTestRunners = 1;
      const numberOfDevicesPerType = 1;
      registry = initRegistry({numberOfDevicesPerType, maxTestRunners});
      try {
        await registry.getDevice('iPhoneX');
      }
      catch (e) {
      }

      expect(createDevice).not.toHaveBeenCalled();
    });

  });

  it('should return a device id for a given type', async () => {
    registry = initRegistry();
    DeviceRegistry.clear();

    const ret = await registry.getDevice('iPhoneX');

    expect(ret).toEqual('id-0-of-type-iPhoneX');
  });

  it('should return a device id for a given type when the registry contains multiple ids', async () => {
    registry = initRegistry({numberOfDevicesPerType: 2});
    DeviceRegistry.clear();
    const ret = await registry.getDevice('iPhoneX');

    expect(ret).toEqual('id-0-of-type-iPhoneX');
  });

  it('should not return a device id for a given type if the device is locked', async () => {
    registry = initRegistry();
    await tryGetDevice('iPhoneX');
    const ret = await tryGetDevice('iPhoneX');

    expect(ret).toEqual(undefined);
  });

  it('should not return a device id for a given type if the device is locked in a different registry', async () => {
    registry = initRegistry();
    const registry2 = initRegistry();
    try {
      await registry2.getDevice('iPhoneX');
    }
    catch (e) {
      // ignore
    }

    const ret = await tryGetDevice('iPhoneX');

    expect(ret).toEqual(undefined);
  });

  const tryGetDevice = async name => {
    try {
      await registry.getDevice(name);
    }
    catch (e) {
      // ignore
    }
  }


});