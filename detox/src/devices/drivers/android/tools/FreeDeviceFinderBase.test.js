const FreeDeviceFinderBase = require('./FreeDeviceFinderBase');
const { emulator5556, emulator5558, emulator5560 } = require('../tools/__mocks__/handles');

describe('devices lookup helper', () => {
  const mockAdb = { devices: jest.fn() };

  let mockDeviceRegistry;
  let mockIsDeviceMatching;
  let uut;
  beforeEach(() => {
    mockAdbDevices([emulator5556]);
    mockDeviceRegistry = { isDeviceBusy: jest.fn().mockReturnValue(false) };
    mockIsDeviceMatching = jest.fn().mockResolvedValue(true);

    const FreeDeviceFinderImpl = class extends FreeDeviceFinderBase {
      constructor(adb, deviceRegistry) {
        super(adb, deviceRegistry);
        this.isDeviceMatching = mockIsDeviceMatching;
      }
    };
    uut = new FreeDeviceFinderImpl(mockAdb, mockDeviceRegistry);
  });

  it('should throw when `isDeviceMatching` is not overridden in a sub-class', async () => {
    uut = new FreeDeviceFinderBase(mockAdb, mockDeviceRegistry);
    expect(uut.findFreeDevice('')).rejects.toEqual({ error: 'Not implemented!' });
  });

  it('should return the only device when it matches, is online and not busy', async () => {
    expect(await uut.findFreeDevice()).toEqual(emulator5556.adbName);
  });

  it('should return null when there are no devices', async () => {
    mockAdbDevices([]);
    expect(await uut.findFreeDevice()).toEqual(null);
  });

  it('should return null when device is busy', async () => {
    mockAllDevicesBusy();
    expect(await uut.findFreeDevice()).toEqual(null);
  });

  it("should return null when device doesn't match", async () => {
    const deviceQuery = 'mockDeviceQuery';
    mockNoDeviceMatches();
    expect(await uut.findFreeDevice(deviceQuery)).toEqual(null);
    expect(mockIsDeviceMatching).toHaveBeenCalledWith(emulator5556, deviceQuery);
  });

  it('should return first device that matches', async () => {
    mockAdbDevices([emulator5556, emulator5558, emulator5560]);
    mockDeviceMatchesName(emulator5558.adbName);
    expect(await uut.findFreeDevice(emulator5558.adbName)).toEqual(emulator5558.adbName);
    expect(mockIsDeviceMatching).toHaveBeenCalledWith(emulator5558, emulator5558.adbName);
  });

  const mockAdbDevices = (devices) => mockAdb.devices.mockResolvedValue({ devices });
  const mockAllDevicesBusy = () => mockDeviceRegistry.isDeviceBusy.mockReturnValue(true);
  const mockNoDeviceMatches = () => mockIsDeviceMatching.mockResolvedValue(false);
  const mockDeviceMatchesName = (adbName) => mockIsDeviceMatching.mockImplementation(async (candidate) => candidate.adbName === adbName);
});
