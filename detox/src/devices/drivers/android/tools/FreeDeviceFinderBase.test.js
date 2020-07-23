const FreeDeviceFinderBase = require('./FreeDeviceFinderBase');

describe('devices lookup helper', () => {
  const mockAdb = { devices: jest.fn() };

  let mockDeviceRegistry;
  let mockIsDeviceMatching;
  let uut;
  beforeEach(() => {
    mockDeviceRegistry = { isDeviceBusy: jest.fn() };
    mockIsDeviceMatching = jest.fn().mockResolvedValue(false);

    const FreeDeviceFinderImpl = class extends FreeDeviceFinderBase {
      constructor(adb, deviceRegistry) {
        super(adb, deviceRegistry);
        this.isDeviceMatching = mockIsDeviceMatching;
      }
    }
    uut = new FreeDeviceFinderImpl(mockAdb, mockDeviceRegistry);
  });

  it('should return null when there are no devices', async () => {
    mockNoAdbDevices();
    mockAllDevicesFree();
    mockAnyDeviceMatches();
    expect(await uut.findFreeDevice()).toEqual(null);
  });

  it('should return null when all devices busy', async () => {
    mockOneAdbDevice();
    mockAllDevicesBusy();
    mockAnyDeviceMatches();
    expect(await uut.findFreeDevice()).toEqual(null);
  });

  it('should return null when no device matches', async () => {
    const deviceQuery = 'mockDeviceQuery';
    const candidate = createDevice();
    mockAdbDevices([candidate]);
    mockAllDevicesFree();
    mockNoDeviceMatches();
    expect(await uut.findFreeDevice(deviceQuery)).toEqual(null);
    expect(mockIsDeviceMatching).toHaveBeenCalledWith(candidate, deviceQuery);
  });

  it('should return first device that matches', async () => {
    const deviceQuery = 'mockDeviceQuery';
    const candidate = createDevice('device2');
    mockAdbDevices([
      createDevice('device1'),
      candidate,
      createDevice('device3'),
    ]);
    mockAllDevicesFree();
    mockNthDeviceMatches(2);
    expect(await uut.findFreeDevice(deviceQuery)).toEqual(candidate.adbName);
    expect(mockIsDeviceMatching).toHaveBeenCalledWith(candidate, deviceQuery);
  });

  it('should throw when `isDeviceMatching` is not overridden in a sub-class', async () => {
    mockOneAdbDevice();
    mockAllDevicesFree();
    uut = new FreeDeviceFinderBase(mockAdb, mockDeviceRegistry);
    expect(uut.findFreeDevice('')).rejects.toEqual({ error: 'Not implemented!' });
  });

  const createDevice = (adbName = 'adbName-mock') => ({ type: 'type-mock', adbName });
  const mockAdbDevices = (devices) => mockAdb.devices.mockResolvedValue({ devices });
  const mockNoAdbDevices = () => mockAdbDevices([]);
  const mockOneAdbDevice = () => mockAdbDevices([createDevice()]);

  const mockAllDevicesBusy = () => mockDeviceRegistry.isDeviceBusy.mockReturnValue(true);
  const mockAllDevicesFree = () => mockDeviceRegistry.isDeviceBusy.mockReturnValue(false);

  const mockAnyDeviceMatches = () => mockIsDeviceMatching.mockResolvedValue(true);
  const mockNoDeviceMatches = () => mockIsDeviceMatching.mockResolvedValue(false);
  const mockNthDeviceMatches = (n) => {
    let mock = mockIsDeviceMatching.mockResolvedValue(false);
    for (let i = 1; i <= n; i++) {
      if (i === n) {
        mock = mock.mockResolvedValueOnce(true);
      } else {
        mock = mock.mockResolvedValueOnce(false);
      }
    }
  };
});
