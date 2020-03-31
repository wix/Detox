describe('ADB devices helper', () => {
  let adbMock;
  let DeviceAllocation;
  let deviceAllocation;

  beforeEach(() => {
    adbMock = {
      devices: jest.fn().mockResolvedValue(new Error('todo in unit test')),
    };

    DeviceAllocation = require('./AdbDevicesHelper');
    deviceAllocation = new DeviceAllocation(adbMock);
  });

  describe('find device', () => {
    it('should query for devices', async () => {
      const matchFn = jest.fn().mockResolvedValue(true);

      mockNoAdbDevices();
      await deviceAllocation.lookupDevice(matchFn);
      expect(adbMock.devices).toHaveBeenCalled();
    });

    it('should return null if there are no devices', async () => {
      const matchFn = jest.fn().mockResolvedValue(true);

      mockNoAdbDevices();
      const device = await deviceAllocation.lookupDevice(matchFn);
      expect(device).toEqual(null);
    });

    it('should look up a device', async () => {
      const matchFn = jest.fn().mockResolvedValue(true);

      const device = aDevice();
      mockAdbDevices([device]);

      const matchingDeviceName = await deviceAllocation.lookupDevice(matchFn);
      expect(matchingDeviceName).toEqual(device.adbName);
    });

    it('should return null for non-matching device', async () => {
      const matchFn = jest.fn().mockResolvedValue(false);

      const device = aDevice();
      mockAdbDevices([device]);

      const matchingDeviceName = await deviceAllocation.lookupDevice(matchFn);
      expect(matchingDeviceName).toEqual(null);
    });

    it('should return first suitable device', async () => {
      const matchFn = jest.fn()
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true);

      mockAdbDevices([
        aDevice('device1'),
        aDevice('device2'),
        aDevice('device3'),
      ]);

      const matchinDeviceName = await deviceAllocation.lookupDevice(matchFn);
      expect(matchinDeviceName).toEqual('device2');
    });
  });

  const aDevice = (adbName = 'mock-name') => ({
    type: 'mock-type',
    adbName,
  });

  const mockAdbDevices = (devices) => {
    adbMock.devices.mockResolvedValue({
      devices,
    });
  };

  const mockNoAdbDevices = () => mockAdbDevices([]);
});
