describe('Allocation driver for attached Android devices', () => {
  const adbPattern = '9A291FFAZ005S9';
  const adbName = 'mock-adb-name';
  const deviceConfig = {
    device: {
      adbName: adbPattern,
    },
  };

  let adb;
  let deviceRegistry;
  let freeDeviceFinder;
  let attachedAndroidLauncher;
  beforeEach(() => {
    const ADB = jest.genMockFromModule('../../../../common/drivers/android/exec/ADB');
    adb = new ADB();

    const DeviceRegistry = jest.genMockFromModule('../../../../DeviceRegistry');
    deviceRegistry = new DeviceRegistry();

    const FreeDeviceFinder = jest.genMockFromModule('../../../../common/drivers/android/tools/FreeDeviceFinder');
    freeDeviceFinder = new FreeDeviceFinder();

    const AttachedAndroidLauncher = jest.genMockFromModule('./AttachedAndroidLauncher');
    attachedAndroidLauncher = new AttachedAndroidLauncher();
  });

  let allocDriver;
  beforeEach(() => {
    const AttachedAndroidAllocDriver = require('./AttachedAndroidAllocDriver');
    allocDriver = new AttachedAndroidAllocDriver({
      adb,
      deviceRegistry,
      freeDeviceFinder,
      attachedAndroidLauncher,
    });
  });


  describe('allocation', () => {
    beforeEach(() => {
      jest.mock('../../../../cookies/AttachedAndroidDeviceCookie');
    });

    const givenDeviceAllocationResult = (result) => deviceRegistry.allocateDevice.mockResolvedValue(result);

    it('should allocate a device', async () => {
      deviceRegistry.allocateDevice.mockImplementation((userFn) => {
        try {
          return userFn();
        } finally {
          expect(freeDeviceFinder.findFreeDevice).toHaveBeenCalledWith(adbPattern);
        }
      });

      await allocDriver.allocate(deviceConfig);
      expect(deviceRegistry.allocateDevice).toHaveBeenCalled();
    });

    it('should fail if allocation fails', async () => {
      deviceRegistry.allocateDevice.mockRejectedValue(new Error('mock error'));
      await expect(allocDriver.allocate(deviceConfig)).rejects.toThrowError('mock error');
    });

    it('should init ADB\'s API-level', async () => {
      givenDeviceAllocationResult(adbName);

      await allocDriver.allocate(deviceConfig);
      expect(adb.apiLevel).toHaveBeenCalledWith(adbName);
    });

    it('should unlock the screen using ADB', async () => {
      givenDeviceAllocationResult(adbName);

      await allocDriver.allocate(deviceConfig);
      expect(adb.unlockScreen).toHaveBeenCalledWith(adbName);
    });

    it('should report boot-event via launcher', async () => {
      givenDeviceAllocationResult(adbName);

      await allocDriver.allocate(deviceConfig);
      expect(attachedAndroidLauncher.notifyLaunchCompleted).toHaveBeenCalledWith(adbName);
    });

    it('should return a valid cookie', async () => {
      const Cookie = require('../../../../cookies/AttachedAndroidDeviceCookie');

      givenDeviceAllocationResult(adbName);

      const result = await allocDriver.allocate(deviceConfig);
      expect(result.constructor.name).toEqual('AttachedAndroidDeviceCookie');
      expect(Cookie).toHaveBeenCalledWith(adbName);
    });
  });

  describe('deallocation', () => {
    let cookie;
    beforeEach(() => {
      jest.unmock('../../../../cookies/AttachedAndroidDeviceCookie');

      const Cookie = require('../../../../cookies/AttachedAndroidDeviceCookie');
      cookie = new Cookie(adbName);
    });

    it('should dispose the device', async () => {
      await allocDriver.free(cookie);
      expect(deviceRegistry.disposeDevice).toHaveBeenCalledWith(adbName);
    });
  });
});
