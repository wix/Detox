const { mockAvdName, emulator5556, localhost5555 } = require('../tools/__mocks__/handles');

describe('FreeEmulatorFinder', () => {
  const mockAdb = { devices: jest.fn() };

  let mockDeviceRegistry;
  let uut;
  beforeEach(() => {
    mockAdbDevices([emulator5556]);

    const DeviceRegistry = jest.genMockFromModule('../../../DeviceRegistry');
    mockDeviceRegistry = new DeviceRegistry();
    mockDeviceRegistry.isDeviceBusy.mockReturnValue(false);

    const FreeEmulatorFinder = require('./FreeEmulatorFinder');
    uut = new FreeEmulatorFinder(mockAdb, mockDeviceRegistry);
  });

  it('should return device when it is an emulator and avdName matches', async () => {
    const result = await uut.findFreeDevice(mockAvdName);
    expect(result).toBe(emulator5556.adbName);
  });

  it('should return null when avdName does not match', async () => {
    expect(await uut.findFreeDevice('wrongAvdName')).toBe(null);
  });

  it('should return null when not an emulator', async () => {
    mockAdbDevices([localhost5555]);
    expect(await uut.findFreeDevice(mockAvdName)).toBe(null);
  });

  const mockAdbDevices = (devices) => mockAdb.devices.mockResolvedValue({ devices });
});
