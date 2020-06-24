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
  let instrumentationArgs;
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

    jest.mock('./tools/instrumentationArgs');
    instrumentationArgs = require('./tools/instrumentationArgs');
    instrumentationArgs.prepareInstrumentationArgs.mockReturnValue({args: [], usedReservedArgs: []});
  });

  let adb;
  beforeEach(() => {
    const ADB = jest.genMockFromModule('./exec/ADB');
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
    jest.mock('./exec/ADB', () => MockADBClass);
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

  describe('URL runtime delivery handling', () => {
    const detoxURLOverride = 'schema://android-url';

    const detoxApiInvocation = {
      method: 'startActivityFromUrl-mocked'
    };
    const mockStartActivityInvokeApi = () => detoxApi.startActivityFromUrl.mockReturnValue(detoxApiInvocation);
    const assertActivityStartInvoked = () => {
      expect(invocationManager.execute).toHaveBeenCalledWith(detoxApiInvocation);
      expect(detoxApi.startActivityFromUrl).toHaveBeenCalledWith(detoxURLOverride);
    }
    const assertActivityStartNotInvoked = () => expect(detoxApi.startActivityFromUrl).not.toHaveBeenCalled();

    const assertArgumentsPreparationWith = (args) => expect(instrumentationArgs.prepareInstrumentationArgs).toHaveBeenCalledWith(args);
    const assertInstrumentationSpawned = () => expect(adb.spawnInstrumentation).toHaveBeenCalled();
    const resetInstrumentationMock = () => adb.spawnInstrumentation.mockReset();
    const assertInstrumentationNotSpawned = () => expect(adb.spawnInstrumentation).not.toHaveBeenCalled();

    describe('in app launch (with dedicated arg)', () => {
      const args = {
        detoxURLOverride,
      };

      it('should spawn instrumentation with the URL in a clean launch', async () => {
        adb.getInstrumentationRunner.mockResolvedValue('mock test-runner');

        await uut.launchApp(deviceId, bundleId, args, '');

        assertArgumentsPreparationWith(args);
        assertInstrumentationSpawned();
      });

      it('should start the app with URL via invocation-manager', async () => {
        mockStartActivityInvokeApi();

        await uut.launchApp(deviceId, bundleId, {}, '');

        resetInstrumentationMock();
        await uut.launchApp(deviceId, bundleId, args, '');

        assertActivityStartInvoked();
        assertInstrumentationNotSpawned();
      });
    });

    describe('via explicit payload-delivery call', () => {
      const args = {
        url: detoxURLOverride,
      };
      const argsDelayed = {
        ...args,
        delayPayload: true,
      }

      it('should start the app via invocation-manager', async () => {
        mockStartActivityInvokeApi();

        await uut.launchApp(deviceId, bundleId, {}, '')
        await uut.deliverPayload(args, deviceId);

        assertActivityStartInvoked();
      });

      it('should not start the app via invocation-manager', async () => {
        mockStartActivityInvokeApi();

        await uut.launchApp(deviceId, bundleId, {}, '')
        await uut.deliverPayload(argsDelayed, deviceId);

        assertActivityStartNotInvoked();
      });
    });

  });

  describe('Notification data handling', () => {
    const notificationArgs = Object.freeze({
      detoxUserNotificationDataURL: '/path/to/notif.data',
    });

    const detoxApiInvocation = {
      method: 'startActivityFromNotification-mocked'
    };
    const mockStartActivityInvokeApi = () => detoxApi.startActivityFromNotification.mockReturnValue(detoxApiInvocation);
    const assertActivityStartInvoked = () => {
      expect(invocationManager.execute).toHaveBeenCalledWith(detoxApiInvocation);
      expect(detoxApi.startActivityFromNotification).toHaveBeenCalledWith(mockNotificationDataTargetPath);
    }
    const assertActivityStartNotInvoked = () => {
      expect(detoxApi.startActivityFromNotification).not.toHaveBeenCalled();
    }

    const assertArgumentsPreparationWith = (args) => expect(instrumentationArgs.prepareInstrumentationArgs).toHaveBeenCalledWith(args);
    const resetInstrumentationMock = () => adb.spawnInstrumentation.mockReset();
    const assertInstrumentationSpawned = () => expect(adb.spawnInstrumentation).toHaveBeenCalled();
    const assertInstrumentationNotSpawned = () => expect(adb.spawnInstrumentation).not.toHaveBeenCalled();

    describe('in app launch (with dedicated arg)', () => {
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

      it('should launch instrumentation with a modified notification data URL arg', async () => {
        fileXfer.send.mockReturnValue(mockNotificationDataTargetPath);

        await uut.launchApp(deviceId, bundleId, notificationArgs, '');

        assertArgumentsPreparationWith({ detoxUserNotificationDataURL: mockNotificationDataTargetPath });
        assertInstrumentationSpawned();
      });
    });

    [
      {
        description: 'in 2nd app launch (i.e. when running)',
        applyFn: () => uut.launchApp(deviceId, bundleId, notificationArgs, ''),
      },
      {
        description: 'via explicit payload-delivery call',
        applyFn: () => uut.deliverPayload(notificationArgs, deviceId),
      },
    ].forEach((spec) => {
      describe(spec.description, () => {
        beforeEach(async () => {
          await uut.launchApp(deviceId, bundleId, {}, '')
        });

        it('should pre-transfer notification data to device', async () => {
          resetInstrumentationMock();
          await spec.applyFn();

          expect(fileXfer.prepareDestinationDir).toHaveBeenCalledWith(deviceId);
          expect(fileXfer.send).toHaveBeenCalledWith(deviceId, notificationArgs.detoxUserNotificationDataURL, 'notification.json');
        });

        it('should start the app with notification data using invocation-manager', async () => {
          mockStartActivityInvokeApi();

          resetInstrumentationMock();
          await spec.applyFn();

          assertActivityStartInvoked();
          assertInstrumentationNotSpawned();
        });
      });
    });

    describe('via explicit payload-delivery call', () => {
      const notificationArgsDelayed = {
        ...notificationArgs,
        delayPayload: true,
      }

      it('should not send notification data is payload send-out is set as delayed', async () => {
        await uut.launchApp(deviceId, bundleId, {}, '')
        await uut.deliverPayload(notificationArgsDelayed, deviceId);

        expect(fileXfer.send).not.toHaveBeenCalled();
      });

      it('should not start the app using invocation-manager', async () => {
        await uut.launchApp(deviceId, bundleId, {}, '')
        await uut.deliverPayload(notificationArgsDelayed, deviceId);

        assertActivityStartNotInvoked();
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
    it('should prepare user launch args', async () => {
      instrumentationArgs.prepareInstrumentationArgs.mockReturnValue({args: [], usedReservedArgs: []});

      const launchArgs = {
        anArg: 'aValue',
      };
      await uut.launchApp(deviceId, bundleId, launchArgs, '');

      expect(instrumentationArgs.prepareInstrumentationArgs).toHaveBeenCalledWith(launchArgs);
    });

    it('should prepare forced debug=false arg', async () => {
      instrumentationArgs.prepareInstrumentationArgs.mockReturnValue({args: [], usedReservedArgs: []});
      await uut.launchApp(deviceId, bundleId, {}, '');
      expect(instrumentationArgs.prepareInstrumentationArgs).toHaveBeenCalledWith({ debug: false });
    });

    it('should spawn instrumentation with prepared arguments', async () => {
      const mockedPreparedUserArgs = ['mocked', 'prepared-args'];
      const mockedPreparedDebugArg = ['debug', 'mocked'];
      instrumentationArgs.prepareInstrumentationArgs
        .mockReturnValueOnce({ args: mockedPreparedUserArgs, usedReservedArgs: [] })
        .mockReturnValueOnce({ args: mockedPreparedDebugArg, usedReservedArgs: [] });

      await uut.launchApp(deviceId, bundleId, {}, '');
      expect(adb.spawnInstrumentation).toHaveBeenCalledWith(expect.anything(), [...mockedPreparedUserArgs, ...mockedPreparedDebugArg], undefined);
    });

    it('should log reserved instrumentation args usage if used in user args', async () => {
      const mockedPreparedUserArgs = ['mocked', 'prepared-args'];
      const usedReservedArgs = ['aaa', 'zzz'];
      const mockedPreparedDebugArg = ['debug', 'mocked'];
      instrumentationArgs.prepareInstrumentationArgs
        .mockReturnValueOnce({ args: mockedPreparedUserArgs, usedReservedArgs })
        .mockReturnValueOnce({ args: mockedPreparedDebugArg, usedReservedArgs: ['shouldnt', 'care'] });

      await uut.launchApp(deviceId, bundleId, {}, '');

      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Arguments [aaa,zzz] were passed in as launchArgs to device.launchApp()'));
      expect(logger.warn).toHaveBeenCalledTimes(1);
    });

    it('should NOT log reserved instrumentation args usage if none used by user', async () => {
      const mockedPreparedUserArgs = ['mocked', 'prepared-args'];
      const mockedPreparedDebugArg = ['debug', 'mocked'];
      instrumentationArgs.prepareInstrumentationArgs
        .mockReturnValueOnce({ args: mockedPreparedUserArgs, usedReservedArgs: [] })
        .mockReturnValueOnce({ args: mockedPreparedDebugArg, usedReservedArgs: ['shouldnt', 'care'] });

      await uut.launchApp(deviceId, bundleId, {}, '');

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
