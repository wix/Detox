describe('Android emulator device allocation', () => {
  const adbName = 'mock_adb_name-1117';
  const avdName = 'mock-AVD-name';

  let logger;
  let retry;
  let eventEmitter;
  let deviceRegistry;
  let freeDeviceFinder;
  let emulatorLauncher;
  let adb;
  let randomFunc;
  let uut;
  beforeEach(() => {
    jest.mock('../../../../../utils/logger');
    logger = require('../../../../../utils/logger');

    jest.mock('../../../../../utils/retry');
    retry = require('../../../../../utils/retry');
    retry.mockImplementation((options, func) => func());

    jest.mock('../../../../../utils/trace', () => ({
      traceCall: jest.fn().mockImplementation((__, func) => func()),
    }));

    const EmulatorLauncher = jest.genMockFromModule('./EmulatorLauncher');
    emulatorLauncher = new EmulatorLauncher();

    const AsyncEmitter = jest.genMockFromModule('../../../../../utils/AsyncEmitter');
    eventEmitter = new AsyncEmitter();

    const DeviceRegistry = jest.genMockFromModule('../../../../../devices/DeviceRegistry');
    deviceRegistry = new DeviceRegistry();
    deviceRegistry.allocateDevice.mockImplementation((func) => func());

    const FreeDeviceFinder = jest.genMockFromModule('../FreeEmulatorFinder');
    freeDeviceFinder = new FreeDeviceFinder();

    const ADB = jest.genMockFromModule('../../exec/ADB');
    adb = new ADB();
    adb.isBootComplete.mockResolvedValue(true);

    randomFunc = jest.fn().mockReturnValue(1);

    const EmulatorDeviceAllocation = require('./EmulatorDeviceAllocation');
    uut = new EmulatorDeviceAllocation(deviceRegistry, freeDeviceFinder, emulatorLauncher, adb, eventEmitter, randomFunc);
  });

  const givenFreeDevice = (adbName) => freeDeviceFinder.findFreeDevice.mockResolvedValue(adbName);
  const givenNoFreeDevices = () => freeDeviceFinder.findFreeDevice.mockResolvedValue(null);
  const givenEmulatorLaunchError = () => emulatorLauncher.launch.mockRejectedValue(new Error());
  const givenRandomFuncResult = (result) => randomFunc.mockReturnValue(result);
  const givenDeviceBootCompleted = () => adb.isBootComplete.mockResolvedValue(true);
  const givenDeviceBootIncomplete = () => adb.isBootComplete.mockResolvedValue(false);
  const expectDeviceBootEvent = (adbName, avdName, coldBoot) =>
    expect(eventEmitter.emit).toHaveBeenCalledWith('bootDevice', {
      coldBoot,
      deviceId: adbName,
      type: avdName,
    });
  const expectDeviceBootEventAnonymous = (avdName, coldBoot) =>
    expect(eventEmitter.emit).toHaveBeenCalledWith('bootDevice', expect.objectContaining({
      coldBoot,
      type: avdName,
    }));

  describe('allocation', () => {
    it('should return a free device', async () => {
      givenFreeDevice(adbName);

      const result = await uut.allocateDevice(avdName);
      expect(result).toEqual(adbName);
    });

    it('should register an allocated device', async () => {
      givenFreeDevice(adbName);
      deviceRegistry.allocateDevice.mockImplementation(async (func) => {
        const result = await func();
        expect(result).toEqual(adbName);
        return result;
      });

      await uut.allocateDevice(avdName);
      expect(deviceRegistry.allocateDevice).toHaveBeenCalled();
    });

    it('should look-up a free device *inside* inter-locked registry callback', async () => {
      givenFreeDevice(adbName);
      deviceRegistry.allocateDevice.mockImplementation(async (func) => {
        expect(freeDeviceFinder.findFreeDevice).not.toHaveBeenCalled();
        return await func();
      });

      await uut.allocateDevice(avdName);
      expect(deviceRegistry.allocateDevice).toHaveBeenCalled();
    });

    it('should launch an emulator if no free devices are available', async () => {
      givenNoFreeDevices();

      await uut.allocateDevice(avdName);
      expect(emulatorLauncher.launch).toHaveBeenCalledWith(avdName, expect.any(Object));
    });

    it('should not launch an emulator if a free device is available', async () => {
      givenFreeDevice(adbName);

      await uut.allocateDevice(avdName);
      expect(emulatorLauncher.launch).not.toHaveBeenCalled();
    });

    it('should fail and deallocate the device if emulator launch fails', async () => {
      givenNoFreeDevices();
      givenEmulatorLaunchError();
      jest.spyOn(uut, 'deallocateDevice');

      await expect(uut.allocateDevice(avdName)).rejects.toThrowError();
      await expect(uut.deallocateDevice).toHaveBeenCalledWith(expect.stringMatching(/emulator-\d+/));
    });

    it('should randomize a custom port for a newly launched emulator, in the 10000-20000 range', async () => {
      givenNoFreeDevices();
      givenRandomFuncResult(0.5);
      const expectedPort = 15000;

      await uut.allocateDevice(avdName);

      expect(emulatorLauncher.launch).toHaveBeenCalledWith(avdName, { port: expectedPort });
    });

    it('should use adjacent even port for a randomized odd port (because this is what Android emulators expect)', async () => {
      givenNoFreeDevices();
      givenRandomFuncResult(0.0001);
      const expectedPort = 10000; // i.e. and not 10001

      await uut.allocateDevice(avdName);

      expect(emulatorLauncher.launch).toHaveBeenCalledWith(avdName, { port: expectedPort });
    });

    it('should register device according to randomly allocated port in registry', async () => {
      givenNoFreeDevices();
      givenRandomFuncResult(0.5);

      deviceRegistry.allocateDevice.mockImplementation(async (func) => {
        const result = await func();
        expect(result).toEqual('emulator-15000');
        return result;
      });

      await uut.allocateDevice(avdName);
    });

    it('should poll for boot completion', async () => {
      givenFreeDevice(adbName);
      givenDeviceBootCompleted();

      retry.mockImplementation(async (options, func) => {
        expect(adb.isBootComplete).not.toHaveBeenCalled();
        await func();
        expect(adb.isBootComplete).toHaveBeenCalledWith(adbName);
      });

      await uut.allocateDevice(avdName);
      expect(retry).toHaveBeenCalled();
    });

    it('should throw if boot completion check returns negative', async () => {
      givenFreeDevice(adbName);
      givenDeviceBootIncomplete();

      try {
        await uut.allocateDevice(avdName);
      } catch (e) {
        expect(e.constructor.name).toEqual('DetoxRuntimeError');
        expect(e.toString()).toContain(`Waited for ${adbName} to complete booting for too long!`);
        return;
      }
      throw new Error('Expected an error');
    });

    it('should call retry with decent options', async () => {
      const expectedRetryOptions = {
        retries: 240,
        interval: 2500,
      };

      givenNoFreeDevices();
      givenDeviceBootCompleted();

      await uut.allocateDevice(avdName);

      expect(retry).toHaveBeenCalledWith(
        expect.objectContaining(expectedRetryOptions),
        expect.any(Function)
      );
    });

    it('should emit a device boot event', async () => {
      givenFreeDevice(adbName);
      givenDeviceBootCompleted();

      await uut.allocateDevice(avdName);

      expectDeviceBootEvent(adbName, avdName, false);
    });

    it('should emit a device boot event for allocated emulators', async () => {
      givenNoFreeDevices();
      givenDeviceBootCompleted();

      await uut.allocateDevice(avdName);

      expectDeviceBootEventAnonymous(avdName, true);
    });

    it('should log pre-allocate message', async () => {
      givenFreeDevice(adbName);

      await uut.allocateDevice(avdName);

      expect(logger.debug).toHaveBeenCalledWith({ event: 'ALLOCATE_DEVICE' }, expect.stringContaining('Trying to allocate'));
      expect(logger.debug).toHaveBeenCalledWith({ event: 'ALLOCATE_DEVICE' }, expect.stringContaining(avdName));
    });

    it('should log post-allocate message', async () => {
      givenFreeDevice(adbName);

      await uut.allocateDevice(avdName);

      expect(logger.debug).toHaveBeenCalledWith({ event: 'ALLOCATE_DEVICE' }, expect.stringContaining(`Settled on ${adbName}`));
      expect(logger.debug).toHaveBeenCalledTimes(2);
    });

    it('should resort to a default random func', async () => {
      givenNoFreeDevices();
      givenDeviceBootCompleted();

      const EmulatorDeviceAllocation = require('./EmulatorDeviceAllocation');
      uut = new EmulatorDeviceAllocation(deviceRegistry, freeDeviceFinder, emulatorLauncher, adb, eventEmitter, undefined);

      await uut.allocateDevice(avdName);
    });
  });

  describe('deallocation', () => {
    it('should dispose the device from the registry', async () => {
      await uut.deallocateDevice(adbName);
      expect(deviceRegistry.disposeDevice).toHaveBeenCalledWith(adbName);
    });

    it('should fail if registry fails', async () => {
      deviceRegistry.disposeDevice.mockRejectedValue(new Error());
      await expect(uut.deallocateDevice(adbName)).rejects.toThrowError();
    });
  });
});
