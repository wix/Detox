describe('DeviceRegistry', () => {
  let fs;
  let createDevice = jest.fn();
  let getDeviceIdsByType = jest.fn();

  function mockDeviceList(type, length) {
    const devicesIds = Array.from(Array(length).keys());
    return devicesIds.map(deviceId => `id-${deviceId}-of-type-${type}`);
  }

  beforeEach(() => {
    jest.mock('fs-extra');
    fs = require('fs-extra');
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue("[]");

    createDevice = jest.fn();
    getDeviceIdsByType = jest.fn();
  });

  const mockDevices = (devices) => getDeviceIdsByType.mockReturnValue(devices);
  const mockNoDevices = () => mockDevices([]);
  const mockBusyDevices = (devices) => fs.readFileSync.mockReturnValue(JSON.stringify(devices));
  const mockNoBusyDevices = () => mockBusyDevices([]);

  function deviceRegistry() {
    const DeviceRegistry = require('./DeviceRegistry');
    const registry = new DeviceRegistry({
      getDeviceIdsByType,
      createDevice,
      lockfile: 'lockfile-path/mock'
    });
    registry.clear();
    return registry;
  }

  describe(`create device`, () => {

    it(`should create device if there's no device available`, async () => {
      mockNoDevices();

      const registry = deviceRegistry();
      await registry.getDevice('iPhone X');

      expect(createDevice).toHaveBeenCalledTimes(1);
      expect(createDevice).toHaveBeenCalledWith('iPhone X');
    });

    it(`should query for available devices by type`, async () => {
      const devices = mockDeviceList('iPhone X', 2);
      const busyDevices = mockDeviceList('iPhone X', 1);
      mockDevices(devices);
      mockBusyDevices(busyDevices);

      const registry = deviceRegistry();
      await registry.getDevice('iPhone X');

      expect(getDeviceIdsByType).toHaveBeenCalledWith('iPhone X', busyDevices);
    });

    it(`should not create device if there's no device available`, async () => {
      const devices = mockDeviceList('iPhone X', 1);
      mockDevices(devices);
      mockNoBusyDevices();

      const registry = deviceRegistry();
      await registry.getDevice('iPhone X');

      expect(createDevice).not.toHaveBeenCalled();
    });

    it(`should create device if all available devices are busy`, async () => {
      const devices = mockDeviceList('iPhone X', 1);
      mockDevices(devices);
      mockBusyDevices(devices);

      const registry = deviceRegistry();
      await registry.getDevice('iPhone X');

      expect(createDevice).toHaveBeenCalledTimes(1);
    });

    it(`should create a lockfile if none exists`, async () => {
      fs.existsSync.mockReturnValue(false);

      deviceRegistry();

      expect(fs.ensureFileSync).toHaveBeenCalledWith('lockfile-path/mock');
      expect(fs.writeFileSync).toHaveBeenCalledWith('lockfile-path/mock', "[]");
    });
  });

  it('should indicate a device is busy', async () => {
    const deviceList = mockDeviceList('iPhone X', 1);
    const deviceId = deviceList[0];

    mockDevices(deviceList);
    mockBusyDevices(deviceList);

    const registry = deviceRegistry();
    await registry.getDevice('iPhoneX');
    expect(await registry.isBusy(deviceId)).toBe(true);
  });

  it('should indicate a device is not busy', async () => {
    const deviceList = mockDeviceList('iPhone X', 1);
    const deviceId = deviceList[0];

    mockDevices(deviceList);
    mockNoBusyDevices();

    const registry = deviceRegistry();
    await registry.getDevice('iPhoneX');
    expect(await registry.isBusy(deviceId)).toBe(false);
  });

  it('should free a busy device', async () => {
    const deviceList = mockDeviceList('iPhone X', 1);
    const deviceId = deviceList[0];
    mockDevices(deviceList);
    mockBusyDevices(deviceList);

    const registry = deviceRegistry();
    await registry.getDevice('iPhoneX');
    await registry.freeDevice(deviceId);
    expect(fs.writeFileSync).toHaveBeenCalledWith('lockfile-path/mock', "[]");
  });
});
