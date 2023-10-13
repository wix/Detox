describe('Emulator launcher', () => {
  const avdName = 'Pixel_Mock';
  const adbName = 'mock-emulator:1234';

  let retry;
  let emulatorExec;
  let adb;
  let launchEmulatorProcess;
  let uut;

  beforeEach(() => {
    jest.mock('../../../../../utils/logger');

    jest.mock('../../../../../utils/retry');
    retry = jest.requireMock('../../../../../utils/retry');
    retry.mockImplementation((options, func) => func());

    const ADB = jest.genMockFromModule('../../../../common/drivers/android/exec/ADB');
    adb = new ADB();
    adb.isBootComplete.mockReturnValue(true);

    const { EmulatorExec } = jest.genMockFromModule('../../../../common/drivers/android/emulator/exec/EmulatorExec');
    emulatorExec = new EmulatorExec();

    jest.mock('./launchEmulatorProcess');
    launchEmulatorProcess = require('./launchEmulatorProcess').launchEmulatorProcess;

    const EmulatorLauncher = require('./EmulatorLauncher');
    uut = new EmulatorLauncher({
      adb,
      emulatorExec,
    });
  });

  describe('launch', () => {
    it('should launch the specified emulator in a separate process', async () => {
      await uut.launch({ avdName, adbName });
      expect(launchEmulatorProcess).toHaveBeenCalledWith(emulatorExec, adb, expect.objectContaining({
        avdName,
        adbName,
      }));
    });

    it('should launch using a specific emulator port, if provided', async () => {
      const port = 1234;
      await uut.launch({ avdName, adbName, port });

      const [[,,command]] = launchEmulatorProcess.mock.calls;
      expect(command.port).toEqual(port);
    });

    it('should retry emulator process launching with custom args', async () => {
      const expectedRetryOptions = {
        retries: 2,
        interval: 100,
      };

      await uut.launch({ avdName, adbName });

      expect(retry).toHaveBeenCalledWith(
        expect.objectContaining(expectedRetryOptions),
        expect.any(Function),
      );
    });

    it('should retry emulator process launching with a conditional to check whether error was specified through binary as unknown', async () => {
      const messageUnknownError = 'failed with code null';

      await uut.launch({ avdName, adbName });

      const mockedCallToRetry = retry.mock.calls[0];
      const callOptions = mockedCallToRetry[0];
      expect(callOptions.conditionFn).toBeDefined();

      expect(callOptions.conditionFn(new Error(messageUnknownError))).toEqual(true);
      expect(callOptions.conditionFn(new Error('other error message'))).toEqual(false);
      expect(callOptions.conditionFn(new Error())).toEqual(false);
    });
  });

  describe('awaitEmulatorBoot', () => {
    const givenDeviceBootCompleted = () => adb.isBootComplete.mockResolvedValue(true);
    const givenDeviceBootIncomplete = () => adb.isBootComplete.mockResolvedValue(false);

    it('should poll for boot completion', async () => {
      expect.assertions(2);
      givenDeviceBootCompleted();

      retry
        .mockImplementationOnce(async (options, func) => {
          expect(adb.isBootComplete).not.toHaveBeenCalled();
          await func();
          expect(adb.isBootComplete).toHaveBeenCalledWith(adbName);
        });

      await uut.awaitEmulatorBoot(adbName);
    });

    it('should throw if boot completion check returns negative', async () => {
      givenDeviceBootIncomplete();

      try {
        await uut.awaitEmulatorBoot(adbName);
      } catch (e) {
        expect(e.constructor.name).toEqual('DetoxRuntimeError');
        expect(e.toString()).toContain(`Waited for ${adbName} to complete booting for too long!`);
        return;
      }
      throw new Error('Expected an error');
    });

    it('should call retry for boot completion - with decent options', async () => {
      const expectedRetryOptions = {
        retries: 240,
        interval: 2500,
      };

      givenDeviceBootCompleted();

      await uut.awaitEmulatorBoot(adbName);

      expect(retry).toHaveBeenCalledWith(
        expect.objectContaining(expectedRetryOptions),
        expect.any(Function)
      );
    });

    it('should poll for boot completion even if emulator is already running', async () => {
      await uut.awaitEmulatorBoot(adbName);
      expect(adb.isBootComplete).toHaveBeenCalledWith(adbName);
    });
  });

  describe('shutdown', () => {
    beforeEach(() => {
      retry.mockImplementation(async ({ retries }, func) => {
        while (retries > 0) {
          try {
            return await func();
          } catch (e) {
            if (!--retries) throw e;
          }
        }
      });
    });

    describe('if it goes as expected', () => {
      beforeEach(async () => {
        adb.getState.mockResolvedValueOnce('device');
        adb.getState.mockResolvedValueOnce('offline');
        adb.getState.mockResolvedValueOnce('none');

        await uut.shutdown(avdName);
      });

      it('should kill device via adb', async () => {
        expect(adb.emuKill).toHaveBeenCalledWith(avdName);
      });

      it('should wait until the device cannot be found', async () => {
        expect(adb.getState).toHaveBeenCalledTimes(3);
      });
    });

    describe('if shutdown does not go well', () => {
      beforeEach(async () => {
        adb.getState.mockResolvedValue('offline');
        await expect(uut.shutdown(avdName)).rejects.toThrowError(new RegExp(`Failed to shut down.*${avdName}`));
      });

      it('should keep polling the emulator status until it is "none"', async () => {
        expect(adb.getState).toHaveBeenCalledTimes(5);
      });
    });
  });
});
