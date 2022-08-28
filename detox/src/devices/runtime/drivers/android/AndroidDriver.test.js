const Deferred = require('../../../../utils/Deferred');

// @ts-nocheck
describe('Android driver', () => {
  const adbName = 'device-adb-name';
  const bundleId = 'bundle-id-mock';
  const detoxServerPort = 1234;
  const mockNotificationDataTargetPath = '/ondevice/path/to/notification.json';

  let logger;
  let fs; // TODO don't mock
  let client;
  let getAbsoluteBinaryPath;
  let eventEmitter;
  let detoxApi;
  let invocationManager;
  let adb;
  let aapt;
  let apkValidator;
  let fileXfer;
  let appInstallHelper;
  let appUninstallHelper;
  let instrumentation;
  let DeviceRegistryClass;

  let uut;
  beforeEach(() => {
    setUpModuleDepMocks();
    setUpClassDepMocks();

    const AndroidDriver = require('./AndroidDriver');
    uut = new AndroidDriver({
      client,
      invocationManager,
      eventEmitter,
      adb,
      aapt,
      apkValidator,
      fileXfer,
      appInstallHelper,
      appUninstallHelper,
      instrumentation,
    }, { adbName });
  });

  describe('Instrumentation bootstrap', () => {
    it('should launch instrumentation upon app launch', async () => {
      const userArgs = {
        anArg: 'aValue',
      };
      await uut.launchApp(bundleId, userArgs, '');
      expect(instrumentation.launch).toHaveBeenCalledWith(adbName, bundleId, userArgs);
    });

    it('should break if instrumentation launch fails', async () => {
      instrumentation.launch.mockRejectedValue(new Error());

      try {
        await uut.launchApp(bundleId, {}, '');
        fail();
      } catch (e) {}
    });

    it('should set a termination callback function', async () => {
      await uut.launchApp(bundleId, {}, '');
      expect(instrumentation.setTerminationFn).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should adb-reverse the detox server port', async () => {
      await uut.launchApp(bundleId, {}, '');
      await expect(adb.reverse).toHaveBeenCalledWith(adbName, detoxServerPort.toString());
    });
  });

  describe('Instrumentation unexpected termination', () => {
    beforeEach(async () => {
      await uut.launchApp(bundleId, {}, '');
      await invokeTerminationCallbackFn();
    });

    it('should clear out the termination callback function', () =>
      expect(instrumentation.setTerminationFn).toHaveBeenCalledWith(null));

    it('should adb-unreverse the detox server port', () =>
      expect(adb.reverseRemove).toHaveBeenCalledWith(adbName, detoxServerPort.toString()));

    const extractTerminationCallbackFn = () => instrumentation.setTerminationFn.mock.calls[0][0];
    const invokeTerminationCallbackFn = async () => {
      const fn = extractTerminationCallbackFn();
      await fn();
    };
  });

  describe('App termination', () => {
    beforeEach(async () => {
      await uut.launchApp(bundleId, {}, '');
      await uut.terminate();
    });

    it('should terminate instrumentation', () =>
      expect(instrumentation.terminate).toHaveBeenCalled());

    it('should clear out the termination callback function', () =>
      expect(instrumentation.setTerminationFn).toHaveBeenCalledWith(null));

    it('should terminate ADB altogether', () =>
      expect(adb.terminate).toHaveBeenCalled());
  });

  describe('Cleanup', () => {
    beforeEach(async () => await uut.cleanup());

    it('should terminate instrumentation', () =>
      expect(instrumentation.terminate).toHaveBeenCalled());

    it('should clear out the termination callback function', () =>
      expect(instrumentation.setTerminationFn).toHaveBeenCalledWith(null));

    it('should turn off the events emitter', () =>
      expect(eventEmitter.off).toHaveBeenCalled());
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
    };
    const assertActivityStartNotInvoked = () => expect(detoxApi.startActivityFromUrl).not.toHaveBeenCalled();

    const assertInstrumentationLaunchedWith = (args) => expect(instrumentation.launch).toHaveBeenCalledWith(adbName, bundleId, args);
    const assertInstrumentationNotLaunched = () => expect(instrumentation.launch).not.toHaveBeenCalled();

    describe('in app launch (with dedicated arg)', () => {
      const args = {
        detoxURLOverride,
      };

      it('should launch instrumentation with the URL in a clean launch', async () => {
        adb.getInstrumentationRunner.mockResolvedValue('mock test-runner');

        await uut.launchApp(bundleId, args, '');

        assertInstrumentationLaunchedWith(args);
      });

      it('should start the app with URL via invocation-manager', async () => {
        mockStartActivityInvokeApi();
        mockInstrumentationRunning();

        await uut.launchApp(bundleId, args, '');

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
      };

      it('should start the app via invocation-manager', async () => {
        mockStartActivityInvokeApi();

        await uut.launchApp(bundleId, {}, '');
        await uut.deliverPayload(args);

        assertActivityStartInvoked();
      });

      it('should not start the app via invocation-manager', async () => {
        mockStartActivityInvokeApi();

        await uut.launchApp(bundleId, {}, '');
        await uut.deliverPayload(argsDelayed);

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
    };
    const assertActivityStartNotInvoked = () => {
      expect(detoxApi.startActivityFromNotification).not.toHaveBeenCalled();
    };

    const assertInstrumentationLaunchedWith = (args) => expect(instrumentation.launch).toHaveBeenCalledWith(adbName, bundleId, args);
    const assertInstrumentationNotSpawned = () => expect(instrumentation.launch).not.toHaveBeenCalled();

    describe('in app launch (with dedicated arg)', () => {
      it('should prepare the device for receiving notification data file', async () => {
        await uut.launchApp(bundleId, notificationArgs, '');
        expect(fileXfer.prepareDestinationDir).toHaveBeenCalledWith(adbName);
      });

      it('should transfer the notification data file to the device', async () => {
        await uut.launchApp(bundleId, notificationArgs, '');
        expect(fileXfer.send).toHaveBeenCalledWith(adbName, notificationArgs.detoxUserNotificationDataURL, 'notification.json');
      });

      it('should not send the data if device prep fails', async () => {
        fileXfer.prepareDestinationDir.mockRejectedValue(new Error());
        await expect(uut.launchApp(bundleId, notificationArgs, '')).rejects.toThrowError();
      });

      it('should launch instrumentation with a modified notification data URL arg', async () => {
        fileXfer.send.mockReturnValue(mockNotificationDataTargetPath);

        await uut.launchApp(bundleId, notificationArgs, '');

        assertInstrumentationLaunchedWith({ detoxUserNotificationDataURL: mockNotificationDataTargetPath });
      });
    });

    [
      {
        description: 'in app launch when already running',
        applyFn: () => {
          mockInstrumentationRunning();
          return uut.launchApp(bundleId, notificationArgs, '');
        },
      },
      {
        description: 'via explicit payload-delivery call',
        applyFn: () => uut.deliverPayload(notificationArgs),
      },
    ].forEach((spec) => {
      describe(spec.description, () => {
        it('should pre-transfer notification data to device', async () => {
          await spec.applyFn();

          expect(fileXfer.prepareDestinationDir).toHaveBeenCalledWith(adbName);
          expect(fileXfer.send).toHaveBeenCalledWith(adbName, notificationArgs.detoxUserNotificationDataURL, 'notification.json');
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
      };

      it('should not send notification data is payload send-out is set as delayed', async () => {
        await uut.launchApp(bundleId, {}, '');
        await uut.deliverPayload(notificationArgsDelayed);

        expect(fileXfer.send).not.toHaveBeenCalled();
      });

      it('should not start the app using invocation-manager', async () => {
        await uut.launchApp(bundleId, {}, '');
        await uut.deliverPayload(notificationArgsDelayed, adbName);

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
      const instrumentationError = new Error('mock instrumentation crash error');
      const waitForCrash = new Deferred();
      instrumentation.waitForCrash.mockReturnValue(waitForCrash.promise);

      await uut.launchApp(bundleId, {}, '');

      const clientWait = new Deferred();
      client.waitUntilReady.mockReturnValue(clientWait.promise);

      const promise = uut.waitUntilReady();
      setTimeout(waitForCrash.reject, 1, instrumentationError);

      try {
        await expect(promise).rejects.toThrowError(instrumentationError);
      } finally {
        clientWait.resolve();
      }
    }, 2000);

    it('should fail with client error if instrumentation dies because of client terminating the app', async () => {
      const instrumentationError = new Error('mock instrumentation crash error');
      const clientCrashError = new Error('mock client crash error');

      const clientWait = new Deferred();
      const clientDisconnect = new Deferred();
      const waitForCrash = new Deferred();

      client.waitUntilReady.mockReturnValue(clientWait.promise);
      client.waitUntilDisconnected.mockReturnValue(clientDisconnect.promise);
      instrumentation.waitForCrash.mockReturnValue(waitForCrash.promise);

      waitForCrash.promise.catch(() => setTimeout(clientWait.reject, 1));
      clientWait.promise.catch(() => setTimeout(clientDisconnect.reject, 2, clientCrashError));

      await uut.launchApp(bundleId, {}, '');

      const promise = uut.waitUntilReady();
      setTimeout(waitForCrash.reject, 1, instrumentationError);

      try {
        await expect(promise).rejects.toThrowError(clientCrashError);
      } finally {
        clientWait.resolve();
      }
    }, 2000);

    it('should abort crash-wait if instrumentation doesnt crash', async () => {
      client.waitUntilReady.mockResolvedValue('mocked');
      await uut.waitUntilReady();
      expect(instrumentation.abortWaitForCrash).toHaveBeenCalled();
    });

    it('should abort crash-wait if instrumentation crashes', async () => {
      client.waitUntilReady.mockResolvedValue('mocked');
      instrumentation.waitForCrash.mockRejectedValue(new Error());

      await uut.launchApp(bundleId, {}, '');
      try {
        await uut.waitUntilReady();
        fail();
      } catch (e) {
        expect(instrumentation.abortWaitForCrash).toHaveBeenCalled();
      }
    });
  });

  describe('App installation', () => {
    const binaryPath = 'mock-bin-path';
    const testBinaryPath = 'mock-test-bin-path';

    const givenAppApkValidationFailure = (error) => apkValidator.validateAppApk.mockRejectedValue(error);
    const givenTestApkValidationFailure = (error) => apkValidator.validateTestApk.mockRejectedValue(error);
    const loggerWarnMessage = () => logger.warn.mock.calls[0][0];

    it('should adb-install the app\'s binary', async () => {
      await uut.installApp(binaryPath, testBinaryPath);

      expect(getAbsoluteBinaryPath).toHaveBeenCalledWith(binaryPath);
      expect(adb.install).toHaveBeenCalledWith(adbName, mockGetAbsoluteBinaryPathImpl(binaryPath));
    });

    it('should adb-install the test binary', async () => {
      await uut.installApp(binaryPath, testBinaryPath);

      expect(getAbsoluteBinaryPath).toHaveBeenCalledWith(binaryPath);
      expect(adb.install).toHaveBeenCalledWith(adbName, mockGetAbsoluteBinaryPathImpl(testBinaryPath));
    });

    it('should resort to auto test-binary path resolution, if not specific', async () => {
      const expectedTestBinPath = mockAPKPathGetTestApkPathImpl(mockGetAbsoluteBinaryPathImpl(binaryPath));

      fs.existsSync.mockReturnValue(true);

      await uut.installApp(binaryPath, undefined);

      expect(fs.existsSync).toHaveBeenCalledWith(expectedTestBinPath);
      expect(adb.install).toHaveBeenCalledWith(adbName, expectedTestBinPath);
    });

    it('should throw if auto test-binary path resolves an invalid file', async () => {
      const expectedTestBinPath = mockAPKPathGetTestApkPathImpl(mockGetAbsoluteBinaryPathImpl(binaryPath));

      fs.existsSync.mockReturnValue(false);

      await expect(uut.installApp(binaryPath, undefined))
        .rejects
        .toThrowErrorMatchingSnapshot(expectedTestBinPath);
    });

    it('should warn if app APK validation fails', async () => {
      const error = new Error('app apk validation failure');
      givenAppApkValidationFailure(error);

      await uut.installApp(binaryPath, testBinaryPath);
      expect(loggerWarnMessage()).toEqual(error.toString());
      expect(apkValidator.validateAppApk).toHaveBeenCalledWith(mockGetAbsoluteBinaryPathImpl(binaryPath));
    });

    it('should warn if test APK validation fails', async () => {
      const error = new Error('test apk validation failure');
      givenTestApkValidationFailure(error);

      await uut.installApp(binaryPath, testBinaryPath);
      expect(loggerWarnMessage()).toEqual(error.toString());
      expect(apkValidator.validateTestApk).toHaveBeenCalledWith(mockGetAbsoluteBinaryPathImpl(testBinaryPath));
    });
  });

  describe('Util-binaries installation', () => {
    const binaryPaths = ['path/to/bin1.apk', '/path/to/bin/2.apk'];

    it('should install using an app-install helper', async () => {
      await uut.installUtilBinaries(binaryPaths);
      expect(appInstallHelper.install).toHaveBeenCalledWith(adbName, binaryPaths[0]);
      expect(appInstallHelper.install).toHaveBeenCalledWith(adbName, binaryPaths[1]);
    });

    it('should break if one installation fails', async () => {
      appInstallHelper.install
        .mockResolvedValueOnce()
        .mockRejectedValueOnce(new Error())
        .mockResolvedValueOnce();

      try {
        await uut.installUtilBinaries(binaryPaths);
        fail();
      } catch (e) {
        expect(appInstallHelper.install).toHaveBeenCalledWith(adbName, binaryPaths[0]);
        expect(appInstallHelper.install).toHaveBeenCalledWith(adbName, binaryPaths[1]);
        expect(appInstallHelper.install).toHaveBeenCalledTimes(2);
      }
    });

    it('should not install if already installed', async () => {
      adb.isPackageInstalled.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
      await uut.installUtilBinaries(binaryPaths);
      expect(appInstallHelper.install).toHaveBeenCalledWith(adbName, binaryPaths[0]);
      expect(appInstallHelper.install).not.toHaveBeenCalledWith(adbName, binaryPaths[1]);
    });

    it('should properly check for preinstallation', async () => {
      const packageId = 'mockPackageId';
      const binaryPath = 'some/path/file.apk';
      aapt.getPackageName.mockResolvedValue(packageId);

      await uut.installUtilBinaries([binaryPath]);
      expect(adb.isPackageInstalled).toHaveBeenCalledWith(adbName, packageId);
      expect(aapt.getPackageName).toHaveBeenCalledWith(mockGetAbsoluteBinaryPathImpl(binaryPath));
    });
  });

  describe('net-port reversing', () => {
    const port = 1337;

    it(`should invoke ADB's reverse`, async () => {
      await uut.reverseTcpPort(port);
      expect(adb.reverse).toHaveBeenCalledWith(adbName, port);
    });

    it(`should invoke ADB's reverse, given a device handle`, async () => {
      await uut.reverseTcpPort(port);
      expect(adb.reverse).toHaveBeenCalledWith(adbName, port);
    });

    it(`should invoke ADB's reverse-remove`, async () => {
      await uut.unreverseTcpPort(port);
      expect(adb.reverseRemove).toHaveBeenCalledWith(adbName, port);
    });

    it(`should invoke ADB's reverse-remove, given a device handle`, async () => {
      await uut.unreverseTcpPort(port);
      expect(adb.reverseRemove).toHaveBeenCalledWith(adbName, port);
    });
  });

  describe('text-typing (global)', () => {
    const text = 'text to type';

    it(`should invoke ADB's text typing`, async () => {
      await uut.typeText( text);
      expect(adb.typeText).toHaveBeenCalledWith(adbName, text);
    });

    it(`should invoke ADB's text typing, given a device handle`, async () => {
      await uut.typeText(text);
      expect(adb.typeText).toHaveBeenCalledWith(adbName, text);
    });
  });

  const setUpModuleDepMocks = () => {
    jest.mock('../../../../utils/logger');
    logger = require('../../../../utils/logger');

    jest.mock('fs-extra', () => ({
      existsSync: jest.fn(),
      realpathSync: jest.fn(),
    }));
    fs = require('fs-extra');

    jest.mock('../../../../utils/encoding', () => ({
      encodeBase64: (x) => `base64(${x})`,
    }));

    jest.mock('../../../../utils/sleep', () => jest.fn().mockResolvedValue(''));
    jest.mock('../../../../utils/retry', () => jest.fn().mockResolvedValue(''));

    jest.mock('../../../../utils/getAbsoluteBinaryPath', () =>
      jest.fn().mockImplementation((x) => `absolutePathOf(${x})`),
    );
    getAbsoluteBinaryPath = require('../../../../utils/getAbsoluteBinaryPath');

    jest.mock('../../../common/drivers/android/tools/apk', () => ({
      getTestApkPath: mockAPKPathGetTestApkPathImpl,
    }));

    jest.mock('../../../../utils/childProcess');

    client = {
      serverUrl: `ws://localhost:${detoxServerPort}`,
      waitUntilReady: jest.fn(),
      waitUntilDisconnected: jest.fn().mockResolvedValue(),
    };

    eventEmitter = {
      emit: jest.fn(),
      off: jest.fn(),
    };

    jest.mock('../../../../android/espressoapi/Detox');
    detoxApi = require('../../../../android/espressoapi/Detox');

    const InvocationManager = jest.genMockFromModule('../../../../invoke').InvocationManager;
    invocationManager = new InvocationManager();
  };

  const setUpClassDepMocks = () => {
    jest.mock('../../../common/drivers/android/tools/MonitoredInstrumentation');
    const MonitoredInstrumentation = require('../../../common/drivers/android/tools/MonitoredInstrumentation');
    instrumentation = new MonitoredInstrumentation();
    mockInstrumentationDead();

    jest.mock('../../../common/drivers/android/exec/ADB');
    const ADB = require('../../../common/drivers/android/exec/ADB');
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

    jest.mock('../../../common/drivers/android/exec/AAPT');
    const AAPT = require('../../../common/drivers/android/exec/AAPT');
    aapt = new AAPT();

    jest.mock('../../../common/drivers/android/tools/ApkValidator');
    const ApkValidator = require('../../../common/drivers/android/tools/ApkValidator');
    apkValidator = new ApkValidator();

    jest.mock('../../../common/drivers/android/tools/TempFileXfer');
    const FileXfer = require('../../../common/drivers/android/tools/TempFileXfer');
    fileXfer = new FileXfer();
    fileXfer.send.mockResolvedValue(mockNotificationDataTargetPath);

    jest.mock('../../../common/drivers/android/tools/AppInstallHelper');
    const AppInstallHelper = require('../../../common/drivers/android/tools/AppInstallHelper');
    appInstallHelper = new AppInstallHelper();

    jest.mock('../../../common/drivers/android/tools/AppUninstallHelper');
    const AppUninstallHelper = require('../../../common/drivers/android/tools/AppUninstallHelper');
    appUninstallHelper = new AppUninstallHelper();


    jest.mock('../../../DeviceRegistry');
    DeviceRegistryClass = require('../../../DeviceRegistry');
    const createRegistry = jest.fn(() => new DeviceRegistryClass());
    DeviceRegistryClass.forIOS = DeviceRegistryClass.forAndroid = createRegistry;
  };

  const mockGetAbsoluteBinaryPathImpl = (x) => `absolutePathOf(${x})`;
  const mockAPKPathGetTestApkPathImpl = (x) => `testApkPathOf(${x})`;

  const mockInstrumentationRunning = () => instrumentation.isRunning.mockReturnValue(true);
  const mockInstrumentationDead = () => instrumentation.isRunning.mockReturnValue(false);
});
