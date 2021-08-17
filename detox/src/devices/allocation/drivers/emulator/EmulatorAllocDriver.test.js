describe('Allocation driver for Google emulators', () => {

  const avdName = 'mock-avd-name';
  const adbName = 'mocked-emulator:5554';
  const placeholderPort = 5554;

  const givenAllocationError = (message = 'mocked rejection') => deviceAllocation.allocateDevice.mockRejectedValue(new Error(message));
  const givenAllocationResult = ({ adbName, placeholderPort, isRunning }) => deviceAllocation.allocateDevice.mockResolvedValue({ adbName, placeholderPort, isRunning });
  const givenAllocationOfRunningEmulator = () => givenAllocationResult({ adbName, placeholderPort, isRunning: true });
  const givenAllocationOfPlaceholderEmulator = () => givenAllocationResult({ adbName, placeholderPort, isRunning: false });
  const givenEmulatorLaunchError = () => emulatorLauncher.launch.mockRejectedValue(new Error());
  const givenValidAVD = () => avdValidator.validate.mockResolvedValue(null);
  const givenInvalidAVD = (message) => avdValidator.validate.mockRejectedValue(new Error(message));
  const expectDeviceBootEvent = (adbName, avdName, coldBoot) =>
    expect(eventEmitter.emit).toHaveBeenCalledWith('bootDevice', {
      coldBoot,
      deviceId: adbName,
      type: avdName,
    });

  let adb;
  let eventEmitter;
  let patchAvdSkinConfig;
  let avdValidator;
  let emulatorVersionResolver;
  let emulatorLauncher;
  let deviceAllocation;
  let uut;
  beforeEach(() => {
    jest.mock('../../../../utils/trace', () => ({
      traceCall: (name, fn) => fn(),
    }));

    jest.mock('../../AndroidEmulatorCookie');

    jest.mock('../../../drivers/android/exec/ADB');
    const ADB = require('../../../drivers/android/exec/ADB');
    adb = new ADB();

    jest.mock('../../../../utils/AsyncEmitter');
    const AsyncEmitter = require('../../../../utils/AsyncEmitter');
    eventEmitter = new AsyncEmitter();

    jest.mock('./patchAvdSkinConfig');
    patchAvdSkinConfig = require('./patchAvdSkinConfig').patchAvdSkinConfig;

    jest.mock('./AVDValidator');
    const AVDValidator = require('./AVDValidator');
    avdValidator = new AVDValidator();

    jest.mock('./EmulatorVersionResolver');
    const EmulatorVersionResolver = require('./EmulatorVersionResolver');
    emulatorVersionResolver = new EmulatorVersionResolver();

    jest.mock('./EmulatorLauncher');
    const EmulatorLauncher = require('./EmulatorLauncher');
    emulatorLauncher = new EmulatorLauncher();

    jest.mock('./EmulatorDeviceAllocation');
    const EmulatorDeviceAllocation = require('./EmulatorDeviceAllocation');
    deviceAllocation = new EmulatorDeviceAllocation();

    const EmulatorAllocDriver = require('./EmulatorAllocDriver');
    uut = new EmulatorAllocDriver({
      adb,
      eventEmitter,
      avdValidator,
      emulatorVersionResolver,
      emulatorLauncher,
      deviceAllocation,
    });
  });

  describe('allocation', () => {
    beforeEach(() => {
      givenAllocationOfRunningEmulator();
    });

    it('should allocate based on an AVD\'s name', async () => {
      await uut.allocate(avdName);
      expect(deviceAllocation.allocateDevice).toHaveBeenCalledWith(avdName);
    });

    it('should allocated based on an AVD specification object', async () => {
      const deviceQuery = {
        avdName,
      };

      await uut.allocate(deviceQuery);
      expect(deviceAllocation.allocateDevice).toHaveBeenCalledWith(avdName);
    });

    it('should fail to allocate if allocation fails', async () => {
      givenAllocationError();

      await expect(uut.allocate(avdName)).rejects.toThrowError();
    });

    describe('given an allocated emulator that is not currently running', () => {
      beforeEach(() => {
        givenAllocationOfPlaceholderEmulator();
      });

      it('should launch it', async () => {
        await uut.allocate(avdName);
        expect(emulatorLauncher.launch).toHaveBeenCalledWith(avdName, adbName, { port: placeholderPort });
      });

      it('should deallocate it, if launching fails', async () => {
        givenEmulatorLaunchError();

        try {
          await uut.allocate(avdName);
        } catch (e) {}
        expect(deviceAllocation.deallocateDevice).toHaveBeenCalledWith(adbName);
      });

      it('should rethrow the error, if launching fails', async () => {
        givenEmulatorLaunchError();
        await expect(uut.allocate(avdName)).rejects.toThrowError();
      });

      it('should emit a boot event with coldBoot=true', async () => {
        givenAllocationOfPlaceholderEmulator();
        await uut.allocate(avdName);
        expectDeviceBootEvent(adbName, avdName, true);
      });
    });

    describe('given an allocated emulator that is already running', () => {
      beforeEach(() => {
        givenAllocationOfRunningEmulator();
      });

      it('should not launch it', async () => {
        await uut.allocate(avdName);
        expect(emulatorLauncher.launch).not.toHaveBeenCalled();
      });

      it('should emit a boot event with coldBoot=false', async () => {
        givenAllocationOfRunningEmulator();
        await uut.allocate(avdName);
        expectDeviceBootEvent(adbName, avdName, false);
      });
    });

    it('should pre-validate proper AVD configuration', async () => {
      givenValidAVD();
      await uut.allocate(avdName);
      expect(avdValidator.validate).toHaveBeenCalledWith(avdName);
    });

    it('should throw if AVD configuration is invalid', async () => {
      givenInvalidAVD('mock invalid AVD');

      await expect(uut.allocate(avdName)).rejects.toThrow(new Error('mock invalid AVD'));
      expect(deviceAllocation.allocateDevice).not.toHaveBeenCalled();
    });

    it('should pre-patch AVD skin configuration', async () => {
      const majorVersion = 33;
      emulatorVersionResolver.resolve.mockResolvedValue({
        major: majorVersion,
      });

      await uut.allocate(avdName);

      expect(patchAvdSkinConfig).toHaveBeenCalledWith(avdName, majorVersion);
    });

    it('should prepare the emulators itself', async () => {
      givenAllocationOfRunningEmulator();

      await uut.allocate(avdName);

      expect(adb.disableAndroidAnimations).toHaveBeenCalledWith(adbName);
      expect(adb.unlockScreen).toHaveBeenCalledWith(adbName);
    });

    it('should inquire the API level', async () => {
      givenAllocationOfRunningEmulator();

      await uut.allocate(avdName);

      expect(adb.apiLevel).toHaveBeenCalledWith(adbName);
    });

    it('should return an Android emulator handle', async () => {
      const AndroidEmulatorCookie = require('../../AndroidEmulatorCookie');

      const handle = await uut.allocate(avdName);
      expect(handle.constructor.name).toEqual('AndroidEmulatorCookie');
      expect(AndroidEmulatorCookie).toHaveBeenCalledWith(adbName, avdName);
    });
  });

  describe('Deallocation', () => {
    let deviceCookie;
    beforeEach(() => {
      const AndroidEmulatorCookie = require('../../AndroidEmulatorCookie');
      deviceCookie = new AndroidEmulatorCookie();
      deviceCookie.adbName = adbName;
    });

    it('should free the emulator instance', async () => {
      await uut.free(deviceCookie);
      expect(deviceAllocation.deallocateDevice).toHaveBeenCalledWith(adbName);
    });

    it('should shut the emulator down', async () => {
      await uut.free(deviceCookie, { shutdown: true });
      expect(emulatorLauncher.shutdown).toHaveBeenCalledWith(deviceCookie.adbName);
    });

    it('should not shut the emulator down, by default', async () => {
      await uut.free(deviceCookie, undefined);
      expect(emulatorLauncher.shutdown).not.toHaveBeenCalled();
    });
  });
});
