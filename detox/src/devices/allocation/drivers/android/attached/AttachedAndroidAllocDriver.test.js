describe.skip('Allocation driver for attached Android devices', () => {
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
  beforeEach(() => {
    const ADB = jest.genMockFromModule('../../../../common/drivers/android/exec/ADB');
    adb = new ADB();

    const DeviceRegistry = jest.genMockFromModule('../../../../DeviceRegistry');
    deviceRegistry = new DeviceRegistry();

    const FreeDeviceFinder = jest.genMockFromModule('../../../../common/drivers/android/tools/FreeDeviceFinder');
    freeDeviceFinder = new FreeDeviceFinder();
  });

  let allocDriver;
  beforeEach(() => {
    const AttachedAndroidAllocDriver = require('./AttachedAndroidAllocDriver');
    allocDriver = new AttachedAndroidAllocDriver({
      adb,
      deviceRegistry,
      freeDeviceFinder,
    });
  });


  describe('allocation', () => {
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

    it('should return a valid cookie', async () => {
      givenDeviceAllocationResult(adbName);

      const result = await allocDriver.allocate(deviceConfig);
      expect(result).toEqual({ adbName });
    });

    describe('post-allocation', () => {
      beforeEach(async () => {
        givenDeviceAllocationResult(adbName);
        await allocDriver.allocate(deviceConfig);
      });

      it('should init ADB\'s API-level', async () => {
        await allocDriver.postAllocate({ adbName });
        expect(adb.apiLevel).toHaveBeenCalledWith(adbName);
      });

      it('should unlock the screen using ADB', async () => {
        await allocDriver.postAllocate({ adbName });
        expect(adb.unlockScreen).toHaveBeenCalledWith(adbName);
      });
    });
  });

  describe('deallocation', () => {
    it('should dispose the device', async () => {
      await allocDriver.free({ adbName });
      expect(deviceRegistry.disposeDevice).toHaveBeenCalledWith(adbName);
    });
  });
});
