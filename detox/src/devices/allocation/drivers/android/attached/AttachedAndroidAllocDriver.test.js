describe('Allocation driver for attached Android devices', () => {
  const adbPattern = '9A291FFAZ005S9';
  const adbName = 'mock-adb-name';
  const deviceConfig = {
    adbName: adbPattern,
  };

  let adb;
  let deviceRegistry;
  let freeDeviceFinder;
  let attachedAndroidLauncher;
  beforeEach(() => {
    jest.mock('../../../../cookies/AndroidDeviceCookie');

    const ADB = jest.genMockFromModule('../../../../common/drivers/android/exec/ADB');
    adb = new ADB();

    const DeviceRegistry = jest.genMockFromModule('../../../../DeviceRegistry');
    deviceRegistry = new DeviceRegistry();

    const FreeDeviceFinder = jest.genMockFromModule('../../../../common/drivers/android/tools/FreeDeviceFinder');
    freeDeviceFinder = new FreeDeviceFinder();

    const AttachedAndroidLauncher = jest.genMockFromModule('./AttachedAndroidLauncher');
    attachedAndroidLauncher = new AttachedAndroidLauncher();
  });

  const givenDeviceAllocationResult = (result) => deviceRegistry.allocateDevice.mockResolvedValue(result);

  describe('allocation', () => {
    let allocDriver;
    beforeEach(() => {
      const { AttachedAndroidAllocDriver } = require('./AttachedAndroidAllocDriver');
      allocDriver = new AttachedAndroidAllocDriver({
        adb,
        deviceRegistry,
        freeDeviceFinder,
        attachedAndroidLauncher,
      });
    });

    it('should allocate a device', async () => {
      deviceRegistry.allocateDevice.mockImplementation((userFn) => {
        try {
          return userFn();
        } finally {
          expect(freeDeviceFinder.findFreeDevice).toHaveBeenCalledWith(adbPattern);
        }
      });

      await allocDriver.allocate(adbPattern);
      expect(deviceRegistry.allocateDevice).toHaveBeenCalled();
    });

    it('should fail if allocation fails', async () => {
      deviceRegistry.allocateDevice.mockRejectedValue(new Error('mock error'));
      await expect(allocDriver.allocate(adbPattern)).rejects.toThrowError('mock error');
    });

    it('should allocate a device based on an object-like configuration', async () => {
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

    it('should init ADB\'s API-level', async () => {
      givenDeviceAllocationResult(adbName);

      await allocDriver.allocate(adbPattern);
      expect(adb.apiLevel).toHaveBeenCalledWith(adbName);
    });

    it('should unlock the screen using ADB', async () => {
      givenDeviceAllocationResult(adbName);

      await allocDriver.allocate(adbPattern);
      expect(adb.unlockScreen).toHaveBeenCalledWith(adbName);
    });

    it('should report boot-event via launcher', async () => {
      givenDeviceAllocationResult(adbName);

      await allocDriver.allocate(adbPattern);
      expect(attachedAndroidLauncher.notifyLaunchCompleted).toHaveBeenCalledWith(adbName);
    });

    it('should return a valid cookie', async () => {
      const AndroidDeviceCookie = require('../../../../cookies/AndroidDeviceCookie');

      givenDeviceAllocationResult(adbName);

      const result = await allocDriver.allocate(adbPattern);
      expect(result.constructor.name).toEqual('AndroidDeviceCookie');
      expect(AndroidDeviceCookie).toHaveBeenCalledWith(adbName);
    });
  });

  describe('deallocation', () => {
    let deallocDriver;
    beforeEach(() => {
      const { AttachedAndroidDeallocDriver } = require('./AttachedAndroidAllocDriver');
      deallocDriver = new AttachedAndroidDeallocDriver(adbName, {
        deviceRegistry,
      });
    });

    it('should dispose the device', async () => {
      await deallocDriver.free();
      expect(deviceRegistry.disposeDevice).toHaveBeenCalledWith(adbName);
    });
  });
});
