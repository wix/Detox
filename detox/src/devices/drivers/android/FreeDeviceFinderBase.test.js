describe('devices lookup helper', () => {
  const mockAdb = {};

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
    const AdbDevicesHelper = jest.genMockFromModule('./tools/AdbDevicesHelper');
    adbDevicesHelper = new AdbDevicesHelper();
    adbDevicesHelper.ctor = jest.fn();
    jest.mock('./tools/AdbDevicesHelper', () => MockAdbDevicesHelper);
  });

  let mockDeviceRegistry;
  let uut;
  beforeEach(() => {
    mockDeviceRegistry = {
      isDeviceBusy: jest.fn().mockReturnValue(false),
    };

    const FreeDeviceFinderBase = require('./FreeDeviceFinderBase');
    uut = new FreeDeviceFinderBase(mockAdb, mockDeviceRegistry);
  });

  it('should create an adb devices helper', async () => {
    expect(adbDevicesHelper.ctor).toHaveBeenCalledWith(mockAdb);
  });

  it('should pass a custom matcher func onto adb-devices helper for finding a free device', async () => {
    await uut.findFreeDevice();
    expect(adbDevicesHelper.lookupDevice).toHaveBeenCalledWith(expect.any(Function));
  });

  it('should return the matched device', async () => {
    const adbName = 'mock-adb-name';
    adbDevicesHelper.lookupDevice.mockReturnValue(adbName);

    const deviceName = await uut.findFreeDevice();
    expect(deviceName).toEqual(adbName);
  });

  it('should throw when the matcher function is called', async () => {
    expect(uut._matcherFn()).rejects.toEqual({ error: 'Not implemented!' });
  });
});