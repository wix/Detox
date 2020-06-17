describe('Android driver', () => {

  const deviceId = 'device-id-mock';
  const bundleId = 'bundle-id-mock';
  const mockNotificationDataTargetPath = '/ondevice/path/to/notification.json';

  const mockGetAbsoluteBinaryPathImpl = (x) => `absolutePathOf(${x})`;
  const mockAPKPathGetTestApkPathImpl = (x) => `testApkPathOf(${x})`;

  class MockADBClass {
    constructor() {
      Object.assign(this, adb);
    }
  }

  class MockTempFileXferClass {
    constructor() {
      Object.assign(this, fileXfer);
    }
  }

  class MockAsyncEmitterClass {
    constructor() {
      this.emit = jest.fn();
    }
  }

  class MockInstrumentationLogsParserClass {
    constructor() {
      this.parse = () => {};
      this.containsStackTraceLog = () => true;
      this.getStackTrace = () => MockInstrumentationLogsParserClass.INSTRUMENTATION_STACKTRACE_MOCK;
    }
  }
  MockInstrumentationLogsParserClass.INSTRUMENTATION_STACKTRACE_MOCK = 'Stacktrace mock';

  class MockInvocationManagerClass {
    constructor() {
      Object.assign(this, invocationManager);
    }
  }

  let logger;
  let client;
  let getAbsoluteBinaryPath;
  let fs;
  let exec;
  let detoxApi;
  beforeEach(() => {
    jest.mock('fs', () => ({
      existsSync: jest.fn(),
      realpathSync: jest.fn(),
    }));
    fs = require('fs');

    jest.mock('../../../utils/encoding', () => ({
      encodeBase64: (x) => `base64(${x})`,
    }));

    jest.mock('../../../utils/sleep', () => jest.fn().mockResolvedValue(''));
    jest.mock('../../../utils/retry', () => jest.fn().mockResolvedValue(''));

    jest.mock('./InstrumentationLogsParser', () => ({
      InstrumentationLogsParser: MockInstrumentationLogsParserClass,
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
      interruptProcess: jest.fn(),
    }));
    exec = require('../../../utils/exec');

    client = {
      configuration: {
        server: 'ws://localhost:1234'
      },
      waitUntilReady: jest.fn(),
    };

    jest.mock('../../../android/espressoapi/Detox');
    detoxApi = require('../../../android/espressoapi/Detox');
  });

  let adb;
  beforeEach(() => {
    const ADB = jest.genMockFromModule('./tools/ADB');
    adb = new ADB();
    adb.adbBin = 'ADB binary mock';
    adb.spawnInstrumentation.mockReturnValue({
      childProcess: {
        on: jest.fn(),
        stdout: {
          setEncoding: jest.fn(),
          on: jest.fn(),
        }
      }
    });
    jest.mock('./tools/ADB', () => MockADBClass);
  });

  let fileXfer;
  beforeEach(() => {
    const TempFilesXfer = jest.genMockFromModule('./tools/TempFileXfer');
    fileXfer = new TempFilesXfer();
    fileXfer.send.mockResolvedValue(mockNotificationDataTargetPath)
    jest.mock('./tools/TempFileXfer', () => MockTempFileXferClass);
  });

  let invocationManager;
  beforeEach(() => {
    const InvocationManager = jest.genMockFromModule('../../../invoke').InvocationManager;
    invocationManager = new InvocationManager();
    jest.mock('../../../invoke', () => ({
      InvocationManager: MockInvocationManagerClass,
    }))
  });

  let uut;
  beforeEach(() => {
    const AndroidDriver = require('./AndroidDriver');
    uut = new AndroidDriver({
      client,
      emitter: new MockAsyncEmitterClass(),
    });
  });

  describe('Instrumentation bootstrap', () => {
    it('should launch instrumentation upon app launch', async () => {
      adb.getInstrumentationRunner.mockResolvedValue('mock test-runner');

      await uut.launchApp(deviceId, bundleId, {}, '');

      expect(adb.spawnInstrumentation).toHaveBeenCalledWith(
        deviceId,
        expect.anything(),
        expect.anything(),
      );
    });
  });

  describe('Notification data handling', () => {
    const notificationArgs = Object.freeze({
      detoxUserNotificationDataURL: '/path/to/notif.data',
    });

    const detoxApiInvocation = {
      method: 'startActivityFromNotification-mocked'
    };
    const mockStartActivityInvokeApi = () => {
      detoxApi.startActivityFromNotification.mockReturnValue(detoxApiInvocation);
    }
    const assertActivityStartInvoked = () => {
      expect(invocationManager.execute).toHaveBeenCalledWith(detoxApiInvocation);
      expect(detoxApi.startActivityFromNotification).toHaveBeenCalledWith(mockNotificationDataTargetPath);
    }
    const assertInstrumentationSpawnedOnce = () => expect(adb.spawnInstrumentation).toHaveBeenCalledTimes(1);

    describe('in app launch (user-notification-data-URL arg)', () => {
      it('should prepare the device for receiving notification data file', async () => {
        await uut.launchApp(deviceId, bundleId, notificationArgs, '');
        expect(fileXfer.prepareDestinationDir).toHaveBeenCalledWith(deviceId);
      });

      it('should transfer the notification data file to the device', async () => {
        await uut.launchApp(deviceId, bundleId, notificationArgs, '');
        expect(fileXfer.send).toHaveBeenCalledWith(deviceId, notificationArgs.detoxUserNotificationDataURL, 'notification.json');
      });

      it('should not send the data if device prep fails', async () => {
        fileXfer.prepareDestinationDir.mockRejectedValue(new Error())
        try {
          await uut.launchApp(deviceId, bundleId, notificationArgs, '');
          fail('Expected an error');
        } catch (e) {
        }
      });

      it('should launch instrument with a modified notification data URL arg', async () => {
        fileXfer.send.mockReturnValue(mockNotificationDataTargetPath);

        await uut.launchApp(deviceId, bundleId, notificationArgs, '');

        expect(adb.spawnInstrumentation).toHaveBeenCalledWith(
          expect.anything(),
          expect.arrayContaining(['detoxUserNotificationDataURL', mockNotificationDataTargetPath]),
          undefined,
        );
      });
    });

    [
      {
        useCaseDescription: 'in 2nd app launch (i.e. when running)',
        deliverFn: () => uut.launchApp(deviceId, bundleId, notificationArgs, ''),
      },
      {
        useCaseDescription: 'via explicit payload-delivery call',
        deliverFn: () => uut.deliverPayload(notificationArgs, deviceId),
      },
    ].forEach((spec) => {
      describe(spec.useCaseDescription, () => {
        beforeEach(async () => {
          await uut.launchApp(deviceId, bundleId, {}, '')
        });

        it('should send notification data to device', async () => {
          await spec.deliverFn();

          expect(fileXfer.prepareDestinationDir).toHaveBeenCalledWith(deviceId);
          expect(fileXfer.send).toHaveBeenCalledWith(deviceId, notificationArgs.detoxUserNotificationDataURL, 'notification.json');
        });

        it('should start the app with notification data using native invocation', async () => {
          mockStartActivityInvokeApi();

          await spec.deliverFn();

          assertActivityStartInvoked();
          assertInstrumentationSpawnedOnce();
        });
      });
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
      setTimeout(async () => await killInstrumentation(adb.spawnInstrumentation()), 1);

      try {
        await promise;
        fail('Expected an error and none was thrown');
      } catch (e) {
        expect(e.toString()).toContain('DetoxRuntimeError: Failed to run application on the device');
        expect(e.toString()).toContain(`Native stacktrace dump: ${MockInstrumentationLogsParserClass.INSTRUMENTATION_STACKTRACE_MOCK}`);
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

      const spawnArgs = adb.spawnInstrumentation.mock.calls[0];
      const spawnedFlags = spawnArgs[1];

      let index = 0;
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

      const spawnArgs = adb.spawnInstrumentation.mock.calls[0];
      const spawnedFlags = spawnArgs[1];

      let index = 3;
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
