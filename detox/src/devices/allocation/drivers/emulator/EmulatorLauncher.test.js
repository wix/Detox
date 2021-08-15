const adbName = 'mock_adb_name-1117';

describe('Emulator launcher', () => {
  let retry;
  let eventEmitter;
  let emulatorExec;
  let adb;
  let launchEmulatorProcess;
  let uut;

  beforeEach(() => {
    jest.mock('../../../../utils/logger');

    jest.mock('../../../../utils/retry');
    retry = require('../../../../utils/retry');
    retry.mockImplementation((options, func) => func())

    jest.mock('../../../../utils/trace', () => ({
      traceCall: jest.fn().mockImplementation((__, func) => func()),
    }));

    require('../../../drivers/android/exec/ADB')
    const ADB = jest.genMockFromModule('../../../drivers/android/exec/ADB');
    adb = new ADB();
    adb.isBootComplete.mockReturnValue(true);

    const AsyncEmitter = jest.genMockFromModule('../../../../utils/AsyncEmitter');
    eventEmitter = new AsyncEmitter();

    const { EmulatorExec } = jest.genMockFromModule('../../../drivers/android/exec/EmulatorExec');
    emulatorExec = new EmulatorExec();

    jest.mock('./launchEmulatorProcess');
    launchEmulatorProcess = require('./launchEmulatorProcess').launchEmulatorProcess;

    const EmulatorLauncher = require('./EmulatorLauncher');
    uut = new EmulatorLauncher({
      adb,
      emulatorExec,
      eventEmitter,
    });
  });

  describe('launch', () => {
    const givenDeviceBootCompleted = () => adb.isBootComplete.mockResolvedValue(true);
    const givenDeviceBootIncomplete = () => adb.isBootComplete.mockResolvedValue(false);

    it('should launch the specified emulator in a separate process', async () => {
      await uut.launch(adbName);
      expect(launchEmulatorProcess).toHaveBeenCalledWith(adbName, emulatorExec, expect.anything());
    });

    it('should launch using a specific emulator port, if provided', async () => {
      const port = 1234;
      await uut.launch(adbName, { port });

      const mockedCall = launchEmulatorProcess.mock.calls[0];
      const commandArg = mockedCall[2];
      expect(commandArg.port).toEqual(port);
    });

    it('should retry emulator process launching with custom args', async () => {
      const expectedRetryOptions = {
        retries: 2,
        interval: 100,
      };

      await uut.launch(adbName);

      expect(retry).toHaveBeenCalledWith(
        expect.objectContaining(expectedRetryOptions),
        expect.any(Function),
      );
    });

    it('should retry emulator process launching with a conditional to check whether error was specified through binary as unknown', async () => {
      const messageUnknownError = 'failed with code null';

      await uut.launch(adbName);

      const mockedCallToRetry = retry.mock.calls[0];
      const callOptions = mockedCallToRetry[0];
      expect(callOptions.conditionFn).toBeDefined();

      expect(callOptions.conditionFn(new Error(messageUnknownError))).toEqual(true);
      expect(callOptions.conditionFn(new Error('other error message'))).toEqual(false);
      expect(callOptions.conditionFn(new Error())).toEqual(false);
    });

    it('should poll for boot completion', async () => {
      givenDeviceBootCompleted();

      retry
        .mockImplementationOnce((options, func) => func())
        .mockImplementationOnce(async (options, func) => {
        expect(adb.isBootComplete).not.toHaveBeenCalled();
        await func();
        expect(adb.isBootComplete).toHaveBeenCalledWith(adbName);
      });

      await uut.launch(adbName);
      expect(retry).toHaveBeenCalledTimes(2);
    });

    it('should throw if boot completion check returns negative', async () => {
      givenDeviceBootIncomplete();

      try {
        await uut.launch(adbName);
      } catch (e) {
        expect(e.constructor.name).toEqual('DetoxRuntimeError');
        expect(e.toString()).toContain(`Waited for ${adbName} to complete booting for too long!`);
        return;
      }
      throw new Error('Expected an error');
    });

    it('should call retry for boot completeion - with decent options', async () => {
      const expectedRetryOptions = {
        retries: 240,
        interval: 2500,
      };

      givenDeviceBootCompleted();

      await uut.launch(adbName);

      expect(retry).toHaveBeenCalledWith(
        expect.objectContaining(expectedRetryOptions),
        expect.any(Function)
      );
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

        await uut.shutdown(adbName);
      });

      it('should kill device via adb', async () => {
        expect(adb.emuKill).toHaveBeenCalledWith(adbName);
      });

      it('should wait until the device cannot be found', async () => {
        expect(adb.getState).toHaveBeenCalledTimes(3);
      });

      it('should emit associated events', async () => {
        expect(eventEmitter.emit).toHaveBeenCalledWith('beforeShutdownDevice', { deviceId: adbName });
        expect(eventEmitter.emit).toHaveBeenCalledWith('shutdownDevice', { deviceId: adbName });
      });
    });

    describe('if shutdown does not go well', () => {
      beforeEach(async () => {
        adb.getState.mockResolvedValue('offline');
        await expect(uut.shutdown(adbName)).rejects.toThrowError(new RegExp(`Failed to shut down.*${adbName}`));
      });

      it('should keep polling the emulator status until it is "none"', async () => {
        expect(adb.getState).toHaveBeenCalledTimes(5);
      });

      it('should not emit shutdownDevice prematurely', async () => {
        expect(eventEmitter.emit).toHaveBeenCalledTimes(1);
        expect(eventEmitter.emit).toHaveBeenCalledWith('beforeShutdownDevice', expect.any(Object));
        expect(eventEmitter.emit).not.toHaveBeenCalledWith('shutdownDevice', expect.any(Object));
      });
    });
  });
});
