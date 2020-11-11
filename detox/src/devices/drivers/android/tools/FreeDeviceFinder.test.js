const FreeDeviceFinder = require('./FreeDeviceFinder');
const { deviceOffline, emulator5556, localhost5555, ip5557 } = require('./__mocks__/handles');

describe('FreeDeviceFinder', () => {
  const mockAdb = { devices: jest.fn() };

  let mockDeviceRegistry;
  let uut;
  beforeEach(() => {
    const DeviceRegistry = jest.genMockFromModule('../../../DeviceRegistry');
    mockDeviceRegistry = new DeviceRegistry();
    mockDeviceRegistry.includes.mockResolvedValue(false);

    uut = new FreeDeviceFinder(mockAdb, mockDeviceRegistry);
  });

  it('should return the only device when it matches, is online and not already taken by other workers', async () => {
    mockAdbDevices([emulator5556]);

    const result = await uut.findFreeDevice(emulator5556.adbName);
    expect(result).toEqual(emulator5556.adbName);
  });

  it('should return null when there are no devices', async () => {
    mockAdbDevices([]);

    const result = await uut.findFreeDevice(emulator5556.adbName);
    expect(result).toEqual(null);
  });

  it('should return null when device is already taken by other workers', async () => {
    mockAdbDevices([emulator5556]);
    mockAllDevicesTaken();

    expect(await uut.findFreeDevice(emulator5556.adbName)).toEqual(null);
  });

  it('should return null when device is offline', async () => {
    mockAdbDevices([deviceOffline]);
    expect(await uut.findFreeDevice(deviceOffline.adbName)).toEqual(null);
  });

  it('should return first device that matches a regular expression', async () => {
    mockAdbDevices([emulator5556, localhost5555, ip5557]);
    const localhost = '^localhost:\\d+$';
    expect(await uut.findFreeDevice(localhost)).toBe(localhost5555.adbName);
  });

  const mockAdbDevices = (devices) => mockAdb.devices.mockResolvedValue({ devices });
  const mockAllDevicesTaken = () => mockDeviceRegistry.includes.mockResolvedValue(true);
});
