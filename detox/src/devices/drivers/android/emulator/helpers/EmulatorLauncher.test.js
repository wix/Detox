const adbName = 'mock_adb_name-1117';
const avdName = 'mock-AVD-name';

describe('Emulator launcher', () => {

  let logger;
  let retry;
  let eventEmitter;
  let emulatorTelnet;
  let emulatorExec;
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

    const AsyncEmitter = jest.genMockFromModule('../../../../..//utils/AsyncEmitter');
    eventEmitter = new AsyncEmitter();

    const EmulatorTelnet = jest.genMockFromModule('../../tools/EmulatorTelnet');
    emulatorTelnet = new EmulatorTelnet();
    jest.mock('../../tools/EmulatorTelnet');

    const { EmulatorExec } = jest.genMockFromModule('../../exec/EmulatorExec');
    emulatorExec = new EmulatorExec();

    const EmulatorLauncher = require('./EmulatorLauncher');
    uut = new EmulatorLauncher(emulatorExec, eventEmitter, () => emulatorTelnet);
  });

  describe('launch', () => {
    // TODO
  });

  describe('teardown', () => {
    it('should kill device via telnet', async () => {
      await uut.shutdown(adbName);

      expect(emulatorTelnet.connect).toHaveBeenCalledWith('1117');
      expect(emulatorTelnet.kill).toHaveBeenCalled();
    });

    it('should emit associated events', async () => {
      await uut.shutdown(adbName);

      expect(eventEmitter.emit).toHaveBeenCalledWith('beforeShutdownDevice', { deviceId: adbName });
      expect(eventEmitter.emit).toHaveBeenCalledWith('shutdownDevice', { deviceId: adbName });
    });

    it('should not emit shutdownDevice prematurely', async () => {
      emulatorTelnet.kill.mockRejectedValue(new Error());

      try {
        await uut.shutdown(adbName);
      } catch (e) {
        expect(eventEmitter.emit).toHaveBeenCalledTimes(1);
        expect(eventEmitter.emit).not.toHaveBeenCalledWith('shutdownDevice', expect.any(Object));
        return;
      }
      throw new Error('Expected an error');
    });

    it('should resort to a default telnet generator func', async () => {
      const EmulatorLauncher = require('./EmulatorLauncher');
      uut = new EmulatorLauncher(emulatorExec, eventEmitter);

      await uut.shutdown(adbName);
    });
  });
});
