const FreeEmulatorFinder = require('./FreeEmulatorFinder');
const { mockAvdName, emulator5556, localhost5555 } = require('../tools/__mocks__/handles');

describe('FreeEmulatorFinder', () => {
  const mockAdb = { devices: jest.fn() };

  let uut;
  beforeEach(() => {
    mockAdbDevices([emulator5556]);
    uut = new FreeEmulatorFinder(mockAdb, { isDeviceBusy: jest.fn().mockReturnValue(false) });
  });

  it('should return device when it is an emulator and avdName matches', async () => {
    expect(await uut.findFreeDevice(mockAvdName)).toBe(emulator5556.adbName);
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
