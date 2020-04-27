describe('Android driver', () => {

  const deviceId = 'device-id-mock';
  const bundleId = 'bundle-id-mock';

  const mockGetAbsoluteBinaryPathImpl = (x) => `absolutePathOf(${x})`;
  const mockAPKPathGetTestApkPathImpl = (x) => `testApkPathOf(${x})`;

  let logger;
  let client;
  let getAbsoluteBinaryPath;
  let fs;
  let exec;
  beforeEach(() => {
    jest.mock('fs', () => ({
      existsSync: jest.fn(),
      realpathSync: jest.fn(),
    }));
    fs = require('fs');

    jest.mock('../../../utils/encoding', () => ({
      encodeBase64: (x) => `base64(${x})`,
    }));

    jest.mock('./tools/ADB', () => mockADBClass);
    jest.mock('../../../utils/sleep', () => jest.fn().mockResolvedValue(''));
    jest.mock('../../../utils/retry', () => jest.fn().mockResolvedValue(''));

    jest.mock('./InstrumentationLogsParser', () => ({
      InstrumentationLogsParser: mockInstrumentationLogsParserClass,
    }));

    jest.mock('../../../utils/getAbsoluteBinaryPath', () =>
      jest.fn().mockImplementation((x) => `absolutePathOf(${x})`),
    );
    getAbsoluteBinaryPath = require('../../../utils/getAbsoluteBinaryPath');

    jest.mock('./tools/APKPath', () => ({
      getTestApkPath: mockAPKPathGetTestApkPathImpl,
    }));

    const mockLogger = {
      warn: jest.fn(),
    };
    jest.mock('../../../utils/logger', () => ({
      child: () => mockLogger,
      ...mockLogger,
    }));
    logger = require('../../../utils/logger');

    jest.mock('../../../utils/exec', () => ({
      spawnAndLog: jest.fn().mockReturnValue({
        childProcess: {
          on: jest.fn(),
          stdout: {
            setEncoding: jest.fn(),
            on: jest.fn(),
          }
        }
      }),
      interruptProcess: jest.fn(),
    }));
    exec = require('../../../utils/exec');

    client = {
      configuration: {
        server: 'ws://localhost:1234'
      },
      waitUntilReady: jest.fn(),
    };
  });

  let uut;
  beforeEach(() => {
    const AndroidDriver = require('./AndroidDriver');
    uut = new AndroidDriver({
      client,
      emitter: new mockAsyncEmitter(),
    });
  });

  describe('Instrumentation bootstrap', () => {
    it('should launch instrumentation upon app launch', async () => {
      await uut.launchApp(deviceId, bundleId, {}, '');

      expect(exec.spawnAndLog).toHaveBeenCalledWith(
        expect.anything(),
        expect.arrayContaining(['shell', 'am', 'instrument']),
        expect.anything(),
      );
    });
  });

  describe('Device ready-wait', () => {
    beforeEach(async () => {
      await uut.launchApp(deviceId, bundleId, {}, '');
    });

    it('should delegate wait to device being ready via client api', async () => {
      await uut.waitUntilReady();
      expect(client.waitUntilReady).toHaveBeenCalled();
    }, 2000);

    it('should fail if instrumentation dies prematurely while waiting for device-ready resolution', async () => {
      const clientWaitResolve = mockDeviceReadyPromise();

      const promise = uut.waitUntilReady();
      setTimeout(async () => await killInstrumentation(exec.spawnAndLog()), 1);

      try {
        await promise;
        fail('Expected an error and none was thrown');
      } catch (e) {
        expect(e.toString()).toContain('DetoxRuntimeError: Failed to run application on the device');
        expect(e.toString()).toContain(`Native stacktrace dump: ${mockInstrumentationLogsParserClass.INSTRUMENTATION_STACKTRACE_MOCK}`);
      } finally {
        clientWaitResolve();
      }
    }, 2000);

    const mockDeviceReadyPromise = () => {
      let clientResolve;
      client.waitUntilReady.mockReturnValue(new Promise((resolve) => clientResolve = resolve));
      return clientResolve;
    };

    const killInstrumentation = async (instrumProcess) => {
      const { childProcess } = instrumProcess;

      const stdoutSubscribeCallArgs = childProcess.stdout.on.mock.calls[0];
      const stdoutListenerFn = stdoutSubscribeCallArgs[1];
      stdoutListenerFn('Doesnt matter what we put here');

      const closeEvCallArgs = childProcess.on.mock.calls[0];
      const closeEvListenerFn = closeEvCallArgs[1];
      await closeEvListenerFn();
    };
  });

  describe('Launch args', () => {
    const expectSpawnedFlag = (spawnedFlags) => ({
      startingIndex: (index) => ({
        toBe: ({key, value}) => {
          expect(spawnedFlags[index]).toEqual('-e');
          expect(spawnedFlags[index + 1]).toEqual(key);
          expect(spawnedFlags[index + 2]).toEqual(value);
          return index + 3;
        }
      }),
    });

    it('should base64-encode and stringify arg values', async () => {
      const launchArgs = {
        'object-arg': {
          such: 'wow',
          much: 'amaze',
          very: 111,
        },
        'string-arg': 'text, with commas-and-dashes,',
      };

      await uut.launchApp(deviceId, bundleId, launchArgs, '');

      const spawnArgs = exec.spawnAndLog.mock.calls[0];
      const spawnedFlags = spawnArgs[1];

      let index = 7;
      index = expectSpawnedFlag(spawnedFlags).startingIndex(index).toBe({
        key: 'object-arg',
        value: 'base64({"such":"wow","much":"amaze","very":111})'
      });
      expectSpawnedFlag(spawnedFlags).startingIndex(index).toBe({
        key: 'string-arg',
        value: 'base64(text, with commas-and-dashes,)'
      });
    });

    // Ref: https://developer.android.com/studio/test/command-line#AMOptionsSyntax
    it('should whitelist reserved instrumentation args with respect to base64 encoding', async () => {
      const launchArgs = {
        // Free arg
        'user-arg': 'merry christ-nukah',

        // Reserved instrumentation args
        'class': 'class-value',
        'package': 'package-value',
        'func': 'func-value',
        'unit': 'unit-value',
        'size': 'size-value',
        'perf': 'perf-value',
        'debug': 'debug-value',
        'log': 'log-value',
        'emma': 'emma-value',
        'coverageFile': 'coverageFile-value',
      };

      await uut.launchApp(deviceId, bundleId, launchArgs, '');

      const spawnArgs = exec.spawnAndLog.mock.calls[0];
      const spawnedFlags = spawnArgs[1];

      let index = 10;
      index = expectSpawnedFlag(spawnedFlags).startingIndex(index).toBe({ key: 'class', value: 'class-value' });
      index = expectSpawnedFlag(spawnedFlags).startingIndex(index).toBe({ key: 'package', value: 'package-value' });
      index = expectSpawnedFlag(spawnedFlags).startingIndex(index).toBe({ key: 'func', value: 'func-value' });
      index = expectSpawnedFlag(spawnedFlags).startingIndex(index).toBe({ key: 'unit', value: 'unit-value' });
      index = expectSpawnedFlag(spawnedFlags).startingIndex(index).toBe({ key: 'size', value: 'size-value' });
      index = expectSpawnedFlag(spawnedFlags).startingIndex(index).toBe({ key: 'perf', value: 'perf-value' });
      index = expectSpawnedFlag(spawnedFlags).startingIndex(index).toBe({ key: 'debug', value: 'debug-value' });
      index = expectSpawnedFlag(spawnedFlags).startingIndex(index).toBe({ key: 'log', value: 'log-value' });
      index = expectSpawnedFlag(spawnedFlags).startingIndex(index).toBe({ key: 'emma', value: 'emma-value' });
      expectSpawnedFlag(spawnedFlags).startingIndex(index).toBe({ key: 'coverageFile', value: 'coverageFile-value' });
    });

    it('should log reserved instrumentation args usage warning, if such have been used', async () => {
      const launchArgs = {
        'class': 'class-value',
      };

      await uut.launchApp(deviceId, bundleId, launchArgs, '');

      expect(logger.warn).toHaveBeenCalled();
    });

    it('should NOT log instrumentation args usage warning, if none used', async () => {
      const launchArgs = {
        'user-arg': 'merry christ-nukah',
      };

      await uut.launchApp(deviceId, bundleId, launchArgs, '');

      expect(logger.warn).not.toHaveBeenCalled();
    });
  });

  describe('App installation', () => {
    const binaryPath = 'mock-bin-path';
    const testBinaryPath = 'mock-test-bin-path';

    it('should adb-install the app\'s binary', async () => {
      await uut.installApp(deviceId, binaryPath, testBinaryPath);

      expect(getAbsoluteBinaryPath).toHaveBeenCalledWith(binaryPath);
      expect(uut.adb.install).toHaveBeenCalledWith(deviceId, mockGetAbsoluteBinaryPathImpl(binaryPath));
    });

    it('should adb-install the test binary', async () => {
      await uut.installApp(deviceId, binaryPath, testBinaryPath);

      expect(getAbsoluteBinaryPath).toHaveBeenCalledWith(binaryPath);
      expect(uut.adb.install).toHaveBeenCalledWith(deviceId, mockGetAbsoluteBinaryPathImpl(testBinaryPath));
    });

    it('should resort to auto test-binary path resolution, if not specific', async () => {
      const expectedTestBinPath = mockAPKPathGetTestApkPathImpl(mockGetAbsoluteBinaryPathImpl(binaryPath));

      fs.existsSync.mockReturnValue(true);

      await uut.installApp(deviceId, binaryPath, undefined);

      expect(fs.existsSync).toHaveBeenCalledWith(expectedTestBinPath);
      expect(uut.adb.install).toHaveBeenCalledWith(deviceId, expectedTestBinPath);
    });

    it('should throw if auto test-binary path resolves an invalid file', async () => {
      const expectedTestBinPath = mockAPKPathGetTestApkPathImpl(mockGetAbsoluteBinaryPathImpl(binaryPath));

      fs.existsSync.mockReturnValue(false);

      try {
        await uut.installApp(deviceId, binaryPath, undefined);
        fail('Expected an error');
      } catch (err) {
        expect(err.message).toContain(`'${expectedTestBinPath}'`);
      }
    });
  });

  describe('net-port reversing', () => {
    const deviceId = 1010;
    const port = 1337;

    it(`should invoke ADB's reverse`, async () => {
      await uut.reverseTcpPort(deviceId, port);
      expect(uut.adb.reverse).toHaveBeenCalledWith(deviceId, port);
    });

    it(`should invoke ADB's reverse-remove`, async () => {
      await uut.unreverseTcpPort(deviceId, port);
      expect(uut.adb.reverseRemove).toHaveBeenCalledWith(deviceId, port);
    });
  });
});

class mockADBClass {
  constructor() {
    this.getInstrumentationRunner = jest.fn();
    this.reverse = jest.fn();
    this.reverseRemove = jest.fn();
    this.install = jest.fn();

    this.adbBin = 'ADB binary mock';
  }
}

class mockAsyncEmitter {
  constructor() {
    this.emit = jest.fn();
  }
}

class mockInstrumentationLogsParserClass {
  constructor() {
    this.parse = () => {};
    this.containsStackTraceLog = () => true;
    this.getStackTrace = () => mockInstrumentationLogsParserClass.INSTRUMENTATION_STACKTRACE_MOCK;
  }
}

mockInstrumentationLogsParserClass.INSTRUMENTATION_STACKTRACE_MOCK = 'Stacktrace mock';
