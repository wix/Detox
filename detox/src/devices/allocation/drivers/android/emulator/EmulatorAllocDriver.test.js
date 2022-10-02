describe('Allocation driver for Google emulators', () => {

  const avdName = 'mock-avd-name';
  const adbName = 'mocked-emulator:5554';
  const placeholderPort = 5554;
  const deviceConfig = {
    device: {
      avdName,
    },
  };
  const launchOptions = {
    headless: true,
    readonly: true,
    bootArgs: { boot: 'args' },
    gpuMode: 'mock-gpu-mode',
  };
  const extendedDeviceConfig = {
    ...deviceConfig,
    ...launchOptions,
  };

  const givenAllocationError = (message = 'mocked rejection') => allocationHelper.allocateDevice.mockRejectedValue(new Error(message));
  const givenAllocationResult = ({ adbName, placeholderPort, isRunning }) => allocationHelper.allocateDevice.mockResolvedValue({ adbName, placeholderPort, isRunning });
  const givenAllocationOfRunningEmulator = () => givenAllocationResult({ adbName, placeholderPort, isRunning: true });
  const givenAllocationOfPlaceholderEmulator = () => givenAllocationResult({ adbName, placeholderPort, isRunning: false });
  const givenEmulatorLaunchError = () => emulatorLauncher.launch.mockRejectedValue(new Error());
  const givenValidAVD = () => avdValidator.validate.mockResolvedValue(null);
  const givenInvalidAVD = (message) => avdValidator.validate.mockRejectedValue(new Error(message));

  let adb;
  let patchAvdSkinConfig;
  let avdValidator;
  let emulatorVersionResolver;
  let emulatorLauncher;
  let allocationHelper;
  beforeEach(() => {
    jest.mock('../../../../../utils/trace');

    jest.mock('../../../../common/drivers/android/exec/ADB');
    const ADB = require('../../../../common/drivers/android/exec/ADB');
    adb = new ADB();

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

    jest.mock('./EmulatorAllocationHelper');
    const EmulatorAllocationHelper = require('./EmulatorAllocationHelper');
    allocationHelper = new EmulatorAllocationHelper();
  });

  let allocDriver;
  beforeEach(() => {
    const EmulatorAllocDriver = require('./EmulatorAllocDriver');
    allocDriver = new EmulatorAllocDriver({
      adb,
      avdValidator,
      emulatorVersionResolver,
      emulatorLauncher,
      allocationHelper,
    });
  });

  describe('allocation', () => {
    beforeEach(() => {
      jest.mock('../../../../cookies/AndroidEmulatorCookie');

      givenAllocationOfRunningEmulator();
    });

    it('should allocate a device based on the AVD\'s name', async () => {
      await allocDriver.allocate(deviceConfig);
      expect(allocationHelper.allocateDevice).toHaveBeenCalledWith(avdName);
    });

    it('should fail to allocate if allocation fails', async () => {
      givenAllocationError();

      await expect(allocDriver.allocate(deviceConfig)).rejects.toThrowError();
    });

    describe('given an allocated emulator that is not currently running', () => {
      beforeEach(() => {
        givenAllocationOfPlaceholderEmulator();
      });

      it('should launch it', async () => {
        await allocDriver.allocate(deviceConfig);
        expect(emulatorLauncher.launch).toHaveBeenCalledWith(avdName, adbName, false, expect.objectContaining({ port: placeholderPort }));
      });

      it('should pass-through various launch options', async () => {
        await allocDriver.allocate(extendedDeviceConfig);
        expect(emulatorLauncher.launch).toHaveBeenCalledWith(
          expect.anything(),
          expect.anything(),
          expect.anything(),
          expect.objectContaining(launchOptions),
        );
      });

      it('should resort to undefined launch options', async () => {
        const launchOptions = {
          headless: undefined,
          readonly: undefined,
          gpuMode: undefined,
          bootArgs: undefined,
        };

        await allocDriver.allocate(deviceConfig);
        expect(emulatorLauncher.launch).toHaveBeenCalledWith(
          expect.anything(),
          expect.anything(),
          expect.anything(),
          expect.objectContaining(launchOptions),
        );
      });

      it('should deallocate it, if launching fails', async () => {
        givenEmulatorLaunchError();

        try {
          await allocDriver.allocate(deviceConfig);
        } catch (e) {}
        expect(allocationHelper.deallocateDevice).toHaveBeenCalledWith(adbName);
      });

      it('should rethrow the error, if launching fails', async () => {
        givenEmulatorLaunchError();
        await expect(allocDriver.allocate(deviceConfig)).rejects.toThrowError();
      });
    });

    describe('given an allocated emulator that is already running', () => {
      beforeEach(() => {
        givenAllocationOfRunningEmulator();
      });

      it('should launch it with isRunning=true', async () => {
        await allocDriver.allocate(deviceConfig);
        expect(emulatorLauncher.launch).toHaveBeenCalledWith(avdName, adbName, true, expect.objectContaining({ port: placeholderPort }));
      });
    });

    it('should pre-validate proper AVD configuration', async () => {
      givenValidAVD();
      await allocDriver.allocate(deviceConfig);
      expect(avdValidator.validate).toHaveBeenCalledWith(avdName, undefined);
    });

    it('should respect headless avd configuration during AVD validation', async () => {
      givenValidAVD();
      await allocDriver.allocate({ ...deviceConfig, headless: true });
      expect(avdValidator.validate).toHaveBeenCalledWith(avdName, true);
    });

    it('should throw if AVD configuration is invalid', async () => {
      givenInvalidAVD('mock invalid AVD');

      await expect(allocDriver.allocate(deviceConfig)).rejects.toThrow(new Error('mock invalid AVD'));
      expect(allocationHelper.allocateDevice).not.toHaveBeenCalled();
    });

    it('should pre-patch AVD skin configuration', async () => {
      const majorVersion = 33;
      emulatorVersionResolver.resolve.mockResolvedValue({
        major: majorVersion,
      });

      await allocDriver.allocate(deviceConfig);

      expect(patchAvdSkinConfig).toHaveBeenCalledWith(avdName, majorVersion);
    });

    it('should prepare the emulators itself', async () => {
      givenAllocationOfRunningEmulator();

      await allocDriver.allocate(deviceConfig);

      expect(adb.disableAndroidAnimations).toHaveBeenCalledWith(adbName);
      expect(adb.unlockScreen).toHaveBeenCalledWith(adbName);
    });

    it('should inquire the API level', async () => {
      givenAllocationOfRunningEmulator();

      await allocDriver.allocate(deviceConfig);

      expect(adb.apiLevel).toHaveBeenCalledWith(adbName);
    });

    it('should return an Android emulator handle', async () => {
      const AndroidEmulatorCookie = require('../../../../cookies/AndroidEmulatorCookie');

      const handle = await allocDriver.allocate(deviceConfig);
      expect(handle.constructor.name).toEqual('AndroidEmulatorCookie');
      expect(AndroidEmulatorCookie).toHaveBeenCalledWith(adbName);
    });
  });

  describe('Deallocation', () => {
    let cookie;
    beforeEach(() => {
      jest.unmock('../../../../cookies/AndroidEmulatorCookie');

      const Cookie = require('../../../../cookies/AndroidEmulatorCookie');
      cookie = new Cookie(adbName);
    });

    it('should free the emulator instance', async () => {
      await allocDriver.free(cookie);
      expect(allocationHelper.deallocateDevice).toHaveBeenCalledWith(adbName);
    });

    it('should shut the emulator down', async () => {
      await allocDriver.free(cookie, { shutdown: true });
      expect(emulatorLauncher.shutdown).toHaveBeenCalledWith(adbName);
    });

    it('should not shut the emulator down, by default', async () => {
      await allocDriver.free(cookie, undefined);
      expect(emulatorLauncher.shutdown).not.toHaveBeenCalled();
    });
  });
});
