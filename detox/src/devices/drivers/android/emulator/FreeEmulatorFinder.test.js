describe('FreeEmulatorFinder', () => {
  const mockAdb = {};
  const mockAvdName = 'mock-avd';

  let AdbDevicesHelperClass;
  beforeEach(() => {
    jest.mock('../tools/AdbDevicesHelper');
    AdbDevicesHelperClass = require('../tools/AdbDevicesHelper');
  });
  const adbDevicesHelperObj = () => AdbDevicesHelperClass.mock.instances[0];

  let mockDeviceRegistry;
  let uut;
  beforeEach(() => {
    jest.mock('../../../../utils/logger');

    const DeviceRegistry = jest.genMockFromModule('../../../DeviceRegistry');
    mockDeviceRegistry = new DeviceRegistry();
    mockDeviceFree();

    const FreeEmulatorFinder = require('./FreeEmulatorFinder');
    uut = new FreeEmulatorFinder(mockAdb, mockDeviceRegistry, mockAvdName);
  });

  it('should create an adb devices helper', async () => {
    expect(AdbDevicesHelperClass).toHaveBeenCalledWith(mockAdb);
  });

  it('should pass a custom matcher func onto adb-devices helper for finding a free emulator', async () => {
    await uut.findFreeDevice();
    expect(adbDevicesHelperObj().lookupDevice).toHaveBeenCalledWith(expect.any(Function));
  });

  it('should return the matched emulator', async () => {
    const adbName = 'mock-adb-name';
    adbDevicesHelperObj().lookupDevice.mockReturnValue(adbName);

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
      mockDeviceBusy();

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

    const resolveMatcherFn = () => adbDevicesHelperObj().lookupDevice.mock.calls[0][0];
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

  const mockDeviceBusy = () => mockDeviceRegistry.isDeviceBusy.mockReturnValue(true);
  const mockDeviceFree = () => mockDeviceRegistry.isDeviceBusy.mockReturnValue(false);
});
