describe('Android emulator allocation helper', () => {
  const adbName = 'mock_adb_name-1117';
  const avdName = 'mock-AVD-name';

  let logger;
  let deviceRegistry;
  let freeDeviceFinder;
  let randomFunc;
  let uut;
  beforeEach(() => {
    jest.mock('../../../../../utils/logger');
    logger = require('../../../../../utils/logger');

    const DeviceRegistry = jest.genMockFromModule('../../../../../devices/DeviceRegistry');
    deviceRegistry = new DeviceRegistry();
    deviceRegistry.allocateDevice.mockImplementation((func) => func());

    const FreeDeviceFinder = jest.genMockFromModule('./FreeEmulatorFinder');
    freeDeviceFinder = new FreeDeviceFinder();

    randomFunc = jest.fn().mockReturnValue(1);

    const EmulatorAllocationHelper = require('./EmulatorAllocationHelper');
    uut = new EmulatorAllocationHelper(deviceRegistry, freeDeviceFinder, randomFunc);
  });

  const givenFreeDevice = (adbName) => freeDeviceFinder.findFreeDevice.mockResolvedValue(adbName);
  const givenNoFreeDevices = () => freeDeviceFinder.findFreeDevice.mockResolvedValue(null);
  const givenRandomFuncResult = (result) => randomFunc.mockReturnValue(result);

  describe('allocation', () => {
    it('should return a free device', async () => {
      givenFreeDevice(adbName);

      const result = await uut.allocateDevice(avdName);
      expect(result.adbName).toEqual(adbName);
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

    it('should indicate emulator is already running in result', async () => {
      givenFreeDevice(adbName);

      const result = await uut.allocateDevice(avdName);
      expect(result.isRunning).toEqual(true);
    });

    describe('when allocated emulator is already running', () => {
      it('should indicate emulator is not already launched in result', async () => {
        givenNoFreeDevices();

        const result = await uut.allocateDevice(avdName);
        expect(result.isRunning).toEqual(false);
      });

      it('should return a custom placeholder-port for a newly launched emulator, in the 10000-20000 range', async () => {
        givenNoFreeDevices();
        givenRandomFuncResult(0.5);

        const expectedPort = 15000;
        const result = await uut.allocateDevice(avdName);
        expect(result.placeholderPort).toEqual(expectedPort);
      });

      it('should use adjacent even port for a randomized odd port (because this is what Android emulators expect)', async () => {
        givenNoFreeDevices();
        givenRandomFuncResult(0.0001);
        const expectedPort = 10000; // i.e. and not 10001

        const result = await uut.allocateDevice(avdName);

        expect(result.placeholderPort).toEqual(expectedPort);
      });
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

      const EmulatorAllocationHelper = require('./EmulatorAllocationHelper');
      uut = new EmulatorAllocationHelper(deviceRegistry, freeDeviceFinder, undefined);

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
