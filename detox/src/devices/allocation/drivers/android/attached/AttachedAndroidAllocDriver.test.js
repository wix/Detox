describe('AttachedAndroidAllocDriver', () => {
  let AttachedAndroidAllocDriver;
  let adb;
  let deviceRegistry;
  let freeDeviceFinder;
  let uut;

  beforeEach(() => {
    adb = {
      devices: jest.fn().mockResolvedValue({
        devices: [{ adbName: 'emulator-5554' }],
      }),
    };

    deviceRegistry = {
      registerDevice: jest.fn(async (getDeviceId) => getDeviceId()),
      unregisterZombieDevices: jest.fn(),
    };

    freeDeviceFinder = {
      findFreeDevice: jest.fn().mockResolvedValue({ adbName: 'emulator-5554' }),
    };

    AttachedAndroidAllocDriver = require('./AttachedAndroidAllocDriver');
    uut = new AttachedAndroidAllocDriver({ adb, deviceRegistry, freeDeviceFinder });
  });

  it('should query default adb devices before delegating to the free device finder', async () => {
    const result = await uut.allocate({
      device: {
        adbName: 'emulator-.*',
      },
    });

    expect(adb.devices).toHaveBeenCalledWith();
    expect(freeDeviceFinder.findFreeDevice).toHaveBeenCalledWith([{ adbName: 'emulator-5554' }], 'emulator-.*');
    expect(result).toEqual({ id: 'emulator-5554', adbName: 'emulator-5554' });
  });

  it('should fail loudly when no matching attached device is found', async () => {
    freeDeviceFinder.findFreeDevice.mockResolvedValue(null);

    await expect(uut.allocate({
      device: {
        adbName: 'emulator-.*',
      },
    })).rejects.toThrow('Failed to find device matching emulator-.*');
  });
});
