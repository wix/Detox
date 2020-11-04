const _ = require('lodash');

const latestInstanceOf = (clazz) => _.last(clazz.mock.instances);

describe('Android driver', () => {
  const deviceId = 'device-id-mock';
  const bundleId = 'bundle-id-mock';
  const detoxServerPort = 1234;
  const mockNotificationDataTargetPath = '/ondevice/path/to/notification.json';

  let logger;
  let client;
  let getAbsoluteBinaryPath;
  let fs;
  let exec;
  let emitter;
  let detoxApi;
  let invocationManager;

  let InstrumentationClass;
  let ADBClass;
  let AAPTClass;
  let FileXferClass;
  let AppInstallHelperClass;
  let DeviceRegistryClass;

  const adbObj = () => latestInstanceOf(ADBClass);
  const aaptObj = () => latestInstanceOf(AAPTClass);
  const fileXferObj = () => latestInstanceOf(FileXferClass);
  const appInstallHelperObj = () => latestInstanceOf(AppInstallHelperClass);
  const instrumentationObj = () => latestInstanceOf(InstrumentationClass);
  const deviceRegistryObj = () => latestInstanceOf(DeviceRegistryClass);

  let uut;
  beforeEach(() => {
    setUpModuleDepMocks();
    setUpClassDepMocks();

    const AndroidDriver = require('./AndroidDriver');
    uut = new AndroidDriver({
      client,
      invocationManager,
      emitter,
    });
  });

  it.only('should', async () => {
    class A {
      doSmt() {
        console.log('doing smt');
      }
    }

    const _  = require('lodash');
    expect(_.isObjectLike(new A())).toEqual(true);
    expect(_.isObjectLike({})).toEqual(true);
    expect(_.isObjectLike('bla bla')).toEqual(false);
  });

  describe('Initialization', () => {
    it('should properly create a FileXfer object', async () => {
      expect(FileXferClass).toHaveBeenCalledWith(adbObj());
    });

    it('should properly create an app-install helper', async () => {
      expect(AppInstallHelperClass).toHaveBeenCalledWith(adbObj(), fileXferObj());
    });
  });

  describe('Instrumentation bootstrap', () => {
    it('should init an instrumentation manager', async () => {
      expect(InstrumentationClass).toHaveBeenCalledWith(adbObj(), logger);
    });

    it('should launch instrumentation upon app launch', async () => {
      const userArgs = {
        anArg: 'aValue',
      };
      await uut.launchApp(deviceId, bundleId, userArgs, '');
      expect(instrumentationObj().launch).toHaveBeenCalledWith(deviceId, bundleId, userArgs);
    });

    it('should break if instrumentation launch fails', async () => {
      instrumentationObj().launch.mockRejectedValue(new Error());

      try {
        await uut.launchApp(deviceId, bundleId, {}, '');
        fail();
      } catch (e) {}
    });

    it('should set a termination callback function', async () => {
      await uut.launchApp(deviceId, bundleId, {}, '');
      expect(instrumentationObj().setTerminationFn).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should adb-reverse the detox server port', async () => {
      await uut.launchApp(deviceId, bundleId, {}, '');
      await expect(adbObj().reverse).toHaveBeenCalledWith(deviceId, detoxServerPort.toString());
    });
  });

  describe('Instrumentation unexpected termination', () => {
    beforeEach(async () => {
      await uut.launchApp(deviceId, bundleId, {}, '');
      await invokeTerminationCallbackFn();
    });

    it('should clear out the termination callback function', () =>
      expect(instrumentationObj().setTerminationFn).toHaveBeenCalledWith(null));

    it('should adb-unreverse the detox server port', () =>
      expect(adbObj().reverseRemove).toHaveBeenCalledWith(deviceId, detoxServerPort.toString()));

    const extractTerminationCallbackFn = () => instrumentationObj().setTerminationFn.mock.calls[0][0];
    const invokeTerminationCallbackFn = async () => {
      const fn = extractTerminationCallbackFn();
      await fn();
    }
  });

  describe('App termination', () => {
    beforeEach(async () => {
      await uut.launchApp(deviceId, bundleId, {}, '');
      await uut.terminate();
    });

    it('should terminate instrumentation', () =>
      expect(instrumentationObj().terminate).toHaveBeenCalled());

    it('should clear out the termination callback function', () =>
      expect(instrumentationObj().setTerminationFn).toHaveBeenCalledWith(null));

    it('should terminate ADB altogether', () =>
      expect(adbObj().terminate).toHaveBeenCalled());
  });

  describe('Cleanup', () => {
    beforeEach(async () => await uut.cleanup(deviceId));

    it('should terminate instrumentation', () =>
      expect(instrumentationObj().terminate).toHaveBeenCalled());

    it('should clear out the termination callback function', () =>
      expect(instrumentationObj().setTerminationFn).toHaveBeenCalledWith(null));

    it('should turn off the events emitter', () =>
      expect(emitter.off).toHaveBeenCalled());

    it('should dispose device', () => {
      expect(deviceRegistryObj().disposeDevice).toHaveBeenCalledWith(deviceId);
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

    const assertInstrumentationLaunchedWith = (args) => expect(instrumentationObj().launch).toHaveBeenCalledWith(deviceId, bundleId, args);
    const assertInstrumentationNotLaunched = () => expect(instrumentationObj().launch).not.toHaveBeenCalled();

    describe('in app launch (with dedicated arg)', () => {
      const args = {
        detoxURLOverride,
      };

      it('should launch instrumentation with the URL in a clean launch', async () => {
        adbObj().getInstrumentationRunner.mockResolvedValue('mock test-runner');

        await uut.launchApp(deviceId, bundleId, args, '');

        assertInstrumentationLaunchedWith(args);
      });

      it('should start the app with URL via invocation-manager', async () => {
        mockStartActivityInvokeApi();
        mockInstrumentationRunning();

        await uut.launchApp(deviceId, bundleId, args, '');

        assertActivityStartInvoked();
        assertInstrumentationNotLaunched();
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

    const assertInstrumentationLaunchedWith = (args) => expect(instrumentationObj().launch).toHaveBeenCalledWith(deviceId, bundleId, args);
    const assertInstrumentationNotSpawned = () => expect(instrumentationObj().launch).not.toHaveBeenCalled();

    describe('in app launch (with dedicated arg)', () => {
      it('should prepare the device for receiving notification data file', async () => {
        await uut.launchApp(deviceId, bundleId, notificationArgs, '');
        expect(fileXferObj().prepareDestinationDir).toHaveBeenCalledWith(deviceId);
      });

      it('should transfer the notification data file to the device', async () => {
        await uut.launchApp(deviceId, bundleId, notificationArgs, '');
        expect(fileXferObj().send).toHaveBeenCalledWith(deviceId, notificationArgs.detoxUserNotificationDataURL, 'notification.json');
      });

      it('should not send the data if device prep fails', async () => {
        fileXferObj().prepareDestinationDir.mockRejectedValue(new Error())
        try {
          await uut.launchApp(deviceId, bundleId, notificationArgs, '');
          fail('Expected an error');
        } catch (e) {
        }
      });

      it('should launch instrumentation with a modified notification data URL arg', async () => {
        fileXferObj().send.mockReturnValue(mockNotificationDataTargetPath);

        await uut.launchApp(deviceId, bundleId, notificationArgs, '');

        assertInstrumentationLaunchedWith({ detoxUserNotificationDataURL: mockNotificationDataTargetPath });
      });
    });

    [
      {
        description: 'in app launch when already running',
        applyFn: () => {
          mockInstrumentationRunning();
          return uut.launchApp(deviceId, bundleId, notificationArgs, '');
        },
      },
      {
        description: 'via explicit payload-delivery call',
        applyFn: () => uut.deliverPayload(notificationArgs, deviceId),
      },
    ].forEach((spec) => {
      describe(spec.description, () => {
        it('should pre-transfer notification data to device', async () => {
          await spec.applyFn();

          expect(fileXferObj().prepareDestinationDir).toHaveBeenCalledWith(deviceId);
          expect(fileXferObj().send).toHaveBeenCalledWith(deviceId, notificationArgs.detoxUserNotificationDataURL, 'notification.json');
        });

        it('should start the app with notification data using invocation-manager', async () => {
          mockStartActivityInvokeApi();

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

        expect(fileXferObj().send).not.toHaveBeenCalled();
      });

      it('should not start the app using invocation-manager', async () => {
        await uut.launchApp(deviceId, bundleId, {}, '')
        await uut.deliverPayload(notificationArgsDelayed, deviceId);

        assertActivityStartNotInvoked();
      });
    });

  });

  describe('Device ready-wait', () => {
    it('should delegate wait to device being ready via client api', async () => {
      await uut.waitUntilReady();
      expect(client.waitUntilReady).toHaveBeenCalled();
    }, 2000);

    it('should fail if instrumentation async\'ly-dies prematurely while waiting for device-ready resolution', async () => {
      const crashError = new Error('mock instrumentation crash error');
      let waitForCrashReject = () => {};
      instrumentationObj().waitForCrash.mockImplementation(() => {
        return new Promise((__, reject) => {
          waitForCrashReject = reject;
        });
      });

      await uut.launchApp(deviceId, bundleId, {}, '');

      const clientWaitResolve = mockDeviceReadyPromise();
      const promise = uut.waitUntilReady();
      setTimeout(() => waitForCrashReject(crashError), 1);

      try {
        await promise;
        fail('Expected an error and none was thrown');
      } catch (e) {
        expect(e).toEqual(crashError);
      } finally {
        clientWaitResolve();
      }
    }, 2000);

    it('should abort crash-wait if instrumentation doesnt crash', async () => {
      client.waitUntilReady.mockResolvedValue('mocked');
      await uut.waitUntilReady();
      expect(instrumentationObj().abortWaitForCrash).toHaveBeenCalled();
    });

    it('should abort crash-wait if instrumentation crashes', async () => {
      client.waitUntilReady.mockResolvedValue('mocked');
      instrumentationObj().waitForCrash.mockRejectedValue(new Error());

      await uut.launchApp(deviceId, bundleId, {}, '');
      try {
        await uut.waitUntilReady();
        fail();
      } catch (e) {
        expect(instrumentationObj().abortWaitForCrash).toHaveBeenCalled();
      }
    });

    const mockDeviceReadyPromise = () => {
      let clientResolve;
      client.waitUntilReady.mockReturnValue(new Promise((resolve) => clientResolve = resolve));
      return clientResolve;
    };
  });

  describe('App installation', () => {
    const binaryPath = 'mock-bin-path';
    const testBinaryPath = 'mock-test-bin-path';

    it('should adb-install the app\'s binary', async () => {
      await uut.installApp(deviceId, binaryPath, testBinaryPath);

      expect(getAbsoluteBinaryPath).toHaveBeenCalledWith(binaryPath);
      expect(adbObj().install).toHaveBeenCalledWith(deviceId, mockGetAbsoluteBinaryPathImpl(binaryPath));
    });

    it('should adb-install the test binary', async () => {
      await uut.installApp(deviceId, binaryPath, testBinaryPath);

      expect(getAbsoluteBinaryPath).toHaveBeenCalledWith(binaryPath);
      expect(adbObj().install).toHaveBeenCalledWith(deviceId, mockGetAbsoluteBinaryPathImpl(testBinaryPath));
    });

    it('should resort to auto test-binary path resolution, if not specific', async () => {
      const expectedTestBinPath = mockAPKPathGetTestApkPathImpl(mockGetAbsoluteBinaryPathImpl(binaryPath));

      fs.existsSync.mockReturnValue(true);

      await uut.installApp(deviceId, binaryPath, undefined);

      expect(fs.existsSync).toHaveBeenCalledWith(expectedTestBinPath);
      expect(adbObj().install).toHaveBeenCalledWith(deviceId, expectedTestBinPath);
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

  describe('Util-binaries installation', () => {
    const binaryPaths = ['path/to/bin1.apk', '/path/to/bin/2.apk'];

    it('should install using an app-install helper', async () => {
      await uut.installUtilBinaries(deviceId, binaryPaths);
      expect(appInstallHelperObj().install).toHaveBeenCalledWith(deviceId, binaryPaths[0]);
      expect(appInstallHelperObj().install).toHaveBeenCalledWith(deviceId, binaryPaths[1]);
    });

    it('should break if one installation fails', async () => {
      appInstallHelperObj().install
        .mockResolvedValueOnce()
        .mockRejectedValueOnce(new Error())
        .mockResolvedValueOnce();

      try {
        await uut.installUtilBinaries(deviceId, binaryPaths);
        fail();
      } catch (e) {
        expect(appInstallHelperObj().install).toHaveBeenCalledWith(deviceId, binaryPaths[0]);
        expect(appInstallHelperObj().install).toHaveBeenCalledWith(deviceId, binaryPaths[1]);
        expect(appInstallHelperObj().install).toHaveBeenCalledTimes(2);
      }
    });

    it('should not install if already installed', async () => {
      adbObj().isPackageInstalled.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
      await uut.installUtilBinaries(deviceId, binaryPaths);
      expect(appInstallHelperObj().install).toHaveBeenCalledWith(deviceId, binaryPaths[0]);
      expect(appInstallHelperObj().install).not.toHaveBeenCalledWith(deviceId, binaryPaths[1]);
    });

    it('should properly check for preinstallation', async () => {
      const packageId = 'mockPackageId';
      const binaryPath = 'some/path/file.apk';
      aaptObj().getPackageName.mockResolvedValue(packageId);

      await uut.installUtilBinaries(deviceId, [binaryPath]);
      expect(adbObj().isPackageInstalled).toHaveBeenCalledWith(deviceId, packageId)
      expect(aaptObj().getPackageName).toHaveBeenCalledWith(mockGetAbsoluteBinaryPathImpl(binaryPath));
    });
  });

  describe('net-port reversing', () => {
    const deviceId = 1010;
    const port = 1337;

    it(`should invoke ADB's reverse`, async () => {
      await uut.reverseTcpPort(deviceId, port);
      expect(adbObj().reverse).toHaveBeenCalledWith(deviceId, port);
    });

    it(`should invoke ADB's reverse-remove`, async () => {
      await uut.unreverseTcpPort(deviceId, port);
      expect(adbObj().reverseRemove).toHaveBeenCalledWith(deviceId, port);
    });
  });

  const setUpModuleDepMocks = () => {
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

    jest.mock('../../../utils/getAbsoluteBinaryPath', () =>
      jest.fn().mockImplementation((x) => `absolutePathOf(${x})`),
    );
    getAbsoluteBinaryPath = require('../../../utils/getAbsoluteBinaryPath');

    jest.mock('./tools/APKPath', () => ({
      getTestApkPath: mockAPKPathGetTestApkPathImpl,
    }));

    jest.mock('../../../utils/logger');
    logger = require('../../../utils/logger');

    jest.mock('../../../utils/exec', () => ({
      interruptProcess: jest.fn(),
    }));
    exec = require('../../../utils/exec');

    client = {
      configuration: {
        server: `ws://localhost:${detoxServerPort}`
      },
      waitUntilReady: jest.fn(),
    };

    emitter = {
      emit: jest.fn(),
      off: jest.fn(),
    };

    jest.mock('../../../android/espressoapi/Detox');
    detoxApi = require('../../../android/espressoapi/Detox');

    const InvocationManager = jest.genMockFromModule('../../../invoke').InvocationManager;
    invocationManager = new InvocationManager();
  };

  const setUpClassDepMocks = () => {
    jest.mock('./tools/MonitoredInstrumentation');
    InstrumentationClass = require('./tools/MonitoredInstrumentation');
    InstrumentationClass.mockImplementation(() => {
      mockInstrumentationDead();
    })

    jest.mock('./exec/ADB');
    ADBClass = require('./exec/ADB');
    ADBClass.mockImplementation(() => {
      const _this = latestInstanceOf(ADBClass);
      _this.adbBin = 'ADB binary mock';
      _this.spawnInstrumentation.mockReturnValue({
        childProcess: {
          on: jest.fn(),
          stdout: {
            setEncoding: jest.fn(),
            on: jest.fn(),
          }
        }
      });
    });

    jest.mock('./exec/AAPT');
    AAPTClass = require('./exec/AAPT');

    jest.mock('./tools/TempFileXfer');
    FileXferClass = require('./tools/TempFileXfer');
    FileXferClass.mockImplementation(() => {
      const _this = latestInstanceOf(FileXferClass);
      _this.send.mockResolvedValue(mockNotificationDataTargetPath)
    });

    jest.mock('./tools/AppInstallHelper');
    AppInstallHelperClass = require('./tools/AppInstallHelper');

    jest.mock('../../DeviceRegistry');
    DeviceRegistryClass = require('../../DeviceRegistry');
    const createRegistry = jest.fn(() => new DeviceRegistryClass());
    DeviceRegistryClass.forIOS = DeviceRegistryClass.forAndroid = createRegistry;
  };

  const mockGetAbsoluteBinaryPathImpl = (x) => `absolutePathOf(${x})`;
  const mockAPKPathGetTestApkPathImpl = (x) => `testApkPathOf(${x})`;

  const mockInstrumentationRunning = () => instrumentationObj().isRunning.mockReturnValue(true);
  const mockInstrumentationDead = () => instrumentationObj().isRunning.mockReturnValue(false);
});
