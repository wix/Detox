const adbName = 'mock_adb_name-1117';

describe('Emulator launcher', () => {
  let retry;
  let eventEmitter;
  let emulatorExec;
  let uut;
  let adb;

  beforeEach(() => {
    jest.mock('../../../../../utils/logger');

    jest.mock('../../../../../utils/retry');
    retry = require('../../../../../utils/retry');

    jest.mock('../../../../../utils/trace', () => ({
      traceCall: jest.fn().mockImplementation((__, func) => func()),
    }));

    const ADB = jest.genMockFromModule('../../exec/ADB');
    adb = new ADB();

    const AsyncEmitter = jest.genMockFromModule('../../../../../utils/AsyncEmitter');
    eventEmitter = new AsyncEmitter();

    const { EmulatorExec } = jest.genMockFromModule('../../exec/EmulatorExec');
    emulatorExec = new EmulatorExec();

    const EmulatorLauncher = require('./EmulatorLauncher');
    uut = new EmulatorLauncher({
      adb,
      emulatorExec,
      eventEmitter,
    });
  });

  describe('launch', () => {
    // TODO
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
