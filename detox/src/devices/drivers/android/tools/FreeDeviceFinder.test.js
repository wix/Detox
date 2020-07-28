const FreeDeviceFinder = require('./FreeDeviceFinder');
const { deviceOffline, emulator5556, localhost5555, ip5557 } = require('./__mocks__/handles');

describe('FreeDeviceFinder', () => {
  const mockAdb = { devices: jest.fn() };

  let mockDeviceRegistry;
  let uut;
  beforeEach(() => {
    mockAdbDevices([emulator5556]);
    mockDeviceRegistry = { isDeviceBusy: jest.fn().mockReturnValue(false) };
    uut = new FreeDeviceFinder(mockAdb, mockDeviceRegistry);
  });

  it('should return the only device when it matches, is online and not busy', async () => {
    expect(await uut.findFreeDevice(emulator5556.adbName)).toEqual(emulator5556.adbName);
  });

  it('should return null when there are no devices', async () => {
    mockAdbDevices([]);
    expect(await uut.findFreeDevice(emulator5556.adbName)).toEqual(null);
  });

  it('should return null when device is busy', async () => {
    mockAllDevicesBusy();
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
  const mockAllDevicesBusy = () => mockDeviceRegistry.isDeviceBusy.mockReturnValue(true);
});
