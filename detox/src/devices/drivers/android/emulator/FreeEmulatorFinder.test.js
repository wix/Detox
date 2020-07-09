describe('FreeEmulatorFinder', () => {
  const mockAdb = {};
  const mockAvdName = 'mock-avd';

  class MockAdbDevicesHelper {
    constructor(...args) {
      adbDevicesHelper.ctor(...args);
    }

    lookupDevice(...args) {
      return adbDevicesHelper.lookupDevice(...args);
    }
  }

  let adbDevicesHelper;
  beforeEach(() => {
    const AdbDevicesHelper = jest.genMockFromModule('../tools/AdbDevicesHelper');
    adbDevicesHelper = new AdbDevicesHelper();
    adbDevicesHelper.ctor = jest.fn();
    jest.mock('../tools/AdbDevicesHelper', () => MockAdbDevicesHelper);
  });

  let mockDeviceRegistry;
  let uut;
  beforeEach(() => {
    jest.mock('../../../../utils/logger', () => ({
      child: jest.fn().mockReturnValue({
        debug: jest.fn(),
      }),
    }));

    mockDeviceRegistry = {
      isDeviceBusy: jest.fn().mockReturnValue(false),
    };

    const FreeEmulatorFinder = require('./FreeEmulatorFinder');
    uut = new FreeEmulatorFinder(mockAdb, mockDeviceRegistry, mockAvdName);
  });

  it('should create an adb devices helper', async () => {
    expect(adbDevicesHelper.ctor).toHaveBeenCalledWith(mockAdb);
  });

  it('should pass a custom matcher func onto adb-devices helper for finding a free emulator', async () => {
    await uut.findFreeDevice();
    expect(adbDevicesHelper.lookupDevice).toHaveBeenCalledWith(expect.any(Function));
  });

  it('should return the matched emulator', async () => {
    const adbName = 'mock-adb-name';
    adbDevicesHelper.lookupDevice.mockReturnValue(adbName);

    const deviceName = await uut.findFreeDevice();
    expect(deviceName).toEqual(adbName);
  });

  describe('Device lookup matcher function', () => {
    it('should restrict matching to emulators', async () => {
      const emuDevice = anEmulatorDevice();
      const nonEmuDevice = aNonEmuDevice();

      await uut.findFreeDevice();

      const matcherFn = resolveMatcherFn();
      expect(await matcherFn(emuDevice)).toEqual(true);
      expect(await matcherFn(nonEmuDevice)).toEqual(false);
    });

    it('should restrict to free (unoccupied) devices', async () => {
      const device = anEmulatorDevice();
      mockDeviceRegistry.isDeviceBusy.mockReturnValue(true);

      await uut.findFreeDevice();

      const matcherFn = resolveMatcherFn();
      expect(await matcherFn(device)).toEqual(false);
      expect(mockDeviceRegistry.isDeviceBusy).toHaveBeenCalledWith('mock-name');
    });

    it('should restrict to the AVD name in question', async () => {
      const device = {
        ...anEmulatorDevice(),
        queryName: jest.fn().mockResolvedValue('other ' + mockAvdName),
      };

      await uut.findFreeDevice();

      const matcherFn = resolveMatcherFn();
      expect(await matcherFn(device)).toEqual(false);
    });

    const resolveMatcherFn = () => adbDevicesHelper.lookupDevice.mock.calls[0][0];
  });

  const anEmulatorDevice = () => ({
    type: 'emulator',
    adbName: 'mock-name',
    queryName: jest.fn().mockResolvedValue(mockAvdName),
  });

  const aNonEmuDevice = () => ({
    type: 'non-emulator',
    adbName: 'mock-name',
    queryName: jest.fn().mockResolvedValue(mockAvdName),
  });
});
