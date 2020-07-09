describe('devices lookup helper', () => {
  const mockAdb = {};
  const mockAdbNamePattern = 'emulator-\d+|localhost:555\\d{1}';

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
    jest.mock('../../../utils/logger', () => ({
      child: jest.fn().mockReturnValue({
        debug: jest.fn(),
      }),
    }));

    mockDeviceRegistry = {
      isDeviceBusy: jest.fn().mockReturnValue(false),
    };

    const FreeAdbDeviceFinder = require('./FreeAdbDeviceFinder');
    uut = new FreeAdbDeviceFinder(mockAdb, mockDeviceRegistry, mockAdbNamePattern);
  });

  describe('matcher function', () => {
    it('should match when adb name matches the pattern', async () => {
      const matchingDevice = getMatchingDevice();
      await uut.findFreeDevice();

      const matcherFn = resolveMatcherFn();
      expect(await matcherFn(matchingDevice)).toEqual(true);
    });

    it('should not match when adb name does not match the pattern', async () => {
      const notMatchingDevice = getNotMatchingDevice();
      await uut.findFreeDevice();

      const matcherFn = resolveMatcherFn();
      expect(await matcherFn(notMatchingDevice)).toEqual(false);
    });

    it('should restrict to free (unoccupied) devices', async () => {
      const device = getMatchingDevice();
      mockDeviceRegistry.isDeviceBusy.mockReturnValue(true);

      await uut.findFreeDevice();

      const matcherFn = resolveMatcherFn();
      expect(await matcherFn(device)).toEqual(false);
      expect(mockDeviceRegistry.isDeviceBusy).toHaveBeenCalledWith(device.adbName);
    });

    const resolveMatcherFn = () => adbDevicesHelper.lookupDevice.mock.calls[0][0];
  });

  const getMatchingDevice = () => ({ adbName: 'localhost:5555' });
  const getNotMatchingDevice = () => ({ adbName: 'localhost:6666' });
});
