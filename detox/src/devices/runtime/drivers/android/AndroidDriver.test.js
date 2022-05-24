// @ts-nocheck
const _ = require('lodash');

describe('Android driver', () => {
  const adbName = 'device-adb-name';
  const packageId = 'com.mock.packageId';
  const roguePackageId = 'some.app.detox.was.not.aware.of.beforehand';
  const detoxServerPortBase = 1234;
  const mockNotificationDataTargetPath = '/ondevice/path/to/notification.json';

  const selectDefaultApp = () => uut.selectApp(defaultApp.alias);
  const launchSelectedApp = (launchArgs = {}) => uut.launchApp(launchArgs, '');
  const deliverPayloadToSelectedApp = (params) => uut.deliverPayload(params);
  const terminateSelectedApp = () => uut.terminate();
  const launchApp = (appId, launchArgs = {}) => uut.launchApp(launchArgs, '', appId);

  const givenResolvedPackageId = (packageId) => aapt.getPackageName.mockResolvedValue(packageId);

  const mockGetAbsoluteBinaryPathImpl = (x) => `absolutePathOf(${x})`;
  const mockAPKPathGetTestApkPathImpl = (x) => `testApkPathOf(${x})`;

  const mockInstrumentationRunning = (app) => app.instrumentation.isRunning.mockReturnValue(true);
  const mockInstrumentationDead = (app) => app.instrumentation.isRunning.mockReturnValue(false);

  let logger;
  let fs;
  let getAbsoluteBinaryPath;
  let eventEmitter;
  let detoxApi;
  let adb;
  let aapt;
  let apkValidator;
  let fileXfer;
  let appInstallHelper;
  let appUninstallHelper;
  let DeviceRegistryClass;
  let defaultApp;
  let secondaryApp;
  let unspecifiedApp;

  let uut;
  beforeEach(async () => {
    setUpModuleDepMocks();
    setUpClassDepMocks();

    const apps = {
      [defaultApp.alias]: defaultApp,
      [secondaryApp.alias]: secondaryApp,
    };
    uut = createDriver(apps);
    await uut.selectApp(defaultApp.alias);
  });

  it('should return the ADB name as the external ID', () => {
    expect(uut.getExternalId()).toEqual(adbName);
  });

  describe('UIAutomator uiDevice', () => {
    it('should be available via a getter', () => {
      expect(uut.getUiDevice()).toEqual(defaultApp.uiDevice);
    });

    it('should consider app selection', () => {
      uut.selectApp(secondaryApp.alias);
      expect(uut.getUiDevice()).toEqual(secondaryApp.uiDevice);
    });
  });

  describe('Press-back', () => {
    it('should delegate back-press to uiDevice', async () => {
      await uut.pressBack();
      expect(defaultApp.uiDevice.pressBack).toHaveBeenCalled();
    });

    it('should consider app selection', async () => {
      uut.selectApp(secondaryApp.alias);
      await uut.pressBack();
      expect(secondaryApp.uiDevice.pressBack).toHaveBeenCalled();
    });
  });

  describe('Nav to home', () => {
    it('should delegate nav-to-home to uiDevice', async () => {
      await uut.sendToHome();
      expect(defaultApp.uiDevice.pressHome).toHaveBeenCalled();
    });

    it('should consider app selection', async () => {
      uut.selectApp(secondaryApp.alias);
      await uut.sendToHome();
      expect(secondaryApp.uiDevice.pressHome).toHaveBeenCalled();
    });
  });

  describe('app launching', () => {
    const userArgs = {
      anArg: 'aValue',
    };

    describe('of a preconfigured app', () => {
      beforeEach(() => givenResolvedPackageId(packageId));

      it('should launch instrumentation upon app launch', async () => {
        await selectDefaultApp();
        await launchSelectedApp(userArgs);
        expect(defaultApp.instrumentation.launch).toHaveBeenCalledWith(adbName, packageId, expect.objectContaining(userArgs));
      });

      it('should break if instrumentation launch fails', async () => {
        defaultApp.instrumentation.launch.mockRejectedValue(new Error());

        await selectDefaultApp();

        try {
          await launchSelectedApp(userArgs);
          fail();
        } catch (e) {}
      });

      it('should set a termination callback function', async () => {
        await selectDefaultApp();
        await launchSelectedApp(userArgs);
        expect(defaultApp.instrumentation.setTerminationFn).toHaveBeenCalledWith(expect.any(Function));
      });

      it('should adb-reverse the detox server port', async () => {
        await selectDefaultApp();
        await launchSelectedApp(userArgs);
        await expect(adb.reverse).toHaveBeenCalledWith(adbName, detoxServerPortBase.toString());
      });

      it('should launch instrumentation strictly associated with the selected app', async () => {
        await uut.selectApp(secondaryApp.alias);
        await uut.launchApp(userArgs, '');
        expect(secondaryApp.instrumentation.launch).toHaveBeenCalledWith(adbName, packageId, expect.objectContaining(userArgs));
      });

      describe('with an unexpected instrumentation termination', () => {
        beforeEach(async () => {
          await selectDefaultApp();
          await launchSelectedApp(userArgs);
          await invokeTerminationCallbackFn(defaultApp);
        });

        it('should clear out the termination callback function', () =>
          expect(defaultApp.instrumentation.setTerminationFn).toHaveBeenCalledWith(null));

        it('should adb-unreverse the detox server port', () =>
          expect(adb.reverseRemove).toHaveBeenCalledWith(adbName, detoxServerPortBase.toString()));

        const extractTerminationCallbackFn = (app) => app.instrumentation.setTerminationFn.mock.calls[0][0];
        const invokeTerminationCallbackFn = async (app) => {
          const fn = extractTerminationCallbackFn(app);
          await fn();
        };
      });
    });

    describe('of a rogue app', () => {
      beforeEach(() => givenResolvedPackageId(packageId));

      it('should launch instrumentation upon app launch', async () => {
        await launchApp(roguePackageId, userArgs);
        expect(unspecifiedApp.instrumentation.launch).toHaveBeenCalledWith(adbName, roguePackageId, expect.objectContaining(userArgs));
      });
    });
  });

  describe('App termination', () => {
    describe('of a preconfigured app', () => {
      beforeEach(async () => {
        givenResolvedPackageId(packageId);

        await selectDefaultApp();
        await launchSelectedApp({});
        await terminateSelectedApp();
      });

      it('should terminate instrumentation', () =>
        expect(defaultApp.instrumentation.terminate).toHaveBeenCalled());

      it('should clear out the termination callback function', () =>
        expect(defaultApp.instrumentation.setTerminationFn).toHaveBeenCalledWith(null));

      it('should terminate ADB altogether', () =>
        expect(adb.terminate).toHaveBeenCalledWith(adbName, packageId));
    });

    describe('of a rogue app', () => {
      beforeEach(async () => {
        givenResolvedPackageId(roguePackageId);

        await launchApp(roguePackageId);
        await uut.terminate();
      });

      it('should terminate instrumentation', () =>
        expect(unspecifiedApp.instrumentation.terminate).toHaveBeenCalled());

      it('should clear out the termination callback function', () =>
        expect(unspecifiedApp.instrumentation.setTerminationFn).toHaveBeenCalledWith(null));
    });
  });

  describe('Cleanup', () => {
    beforeEach(async () => await uut.cleanup());

    it('should terminate instrumentation associated with all apps', () => {
      expect(defaultApp.instrumentation.terminate).toHaveBeenCalled();
      expect(secondaryApp.instrumentation.terminate).toHaveBeenCalled();
      expect(unspecifiedApp.instrumentation.terminate).toHaveBeenCalled();
    });

    it('should clear out the termination callback of instrumentations of all apps', () => {
      expect(defaultApp.instrumentation.setTerminationFn).toHaveBeenCalledWith(null);
      expect(secondaryApp.instrumentation.setTerminationFn).toHaveBeenCalledWith(null);
      expect(unspecifiedApp.instrumentation.setTerminationFn).toHaveBeenCalledWith(null);
    });

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
      expect(defaultApp.invocationManager.execute).toHaveBeenCalledWith(detoxApiInvocation);
      expect(detoxApi.startActivityFromUrl).toHaveBeenCalledWith(detoxURLOverride);
    };
    const assertActivityStartNotInvoked = () => expect(detoxApi.startActivityFromUrl).not.toHaveBeenCalled();

    const assertInstrumentationLaunchedWith = (args) => expect(defaultApp.instrumentation.launch).toHaveBeenCalledWith(adbName, packageId, expect.objectContaining(args));
    const assertInstrumentationNotLaunched = () => expect(defaultApp.instrumentation.launch).not.toHaveBeenCalled();

    beforeEach(async () => {
      givenResolvedPackageId(packageId);
      await selectDefaultApp();
    });

    describe('in app launch (with dedicated arg)', () => {
      const args = {
        detoxURLOverride,
      };

      it('should launch instrumentation with the URL in a clean launch', async () => {
        adb.getInstrumentationRunner.mockResolvedValue('mock test-runner');

        await launchSelectedApp(args);
        assertInstrumentationLaunchedWith(args);
      });

      it('should start the app with URL via invocation-manager', async () => {
        mockStartActivityInvokeApi();
        mockInstrumentationRunning(defaultApp);

        await launchSelectedApp(args);

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

        await launchSelectedApp({});
        await uut.deliverPayload(args);

        assertActivityStartInvoked();
      });

      it('should not start the app via invocation-manager', async () => {
        mockStartActivityInvokeApi();

        await launchSelectedApp({});
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
      expect(defaultApp.invocationManager.execute).toHaveBeenCalledWith(detoxApiInvocation);
      expect(detoxApi.startActivityFromNotification).toHaveBeenCalledWith(mockNotificationDataTargetPath);
    };
    const assertActivityStartNotInvoked = () => {
      expect(detoxApi.startActivityFromNotification).not.toHaveBeenCalled();
    };

    const assertInstrumentationLaunchedWith = (args) => expect(defaultApp.instrumentation.launch).toHaveBeenCalledWith(adbName, packageId, expect.objectContaining(args));
    const assertInstrumentationNotSpawned = () => expect(defaultApp.instrumentation.launch).not.toHaveBeenCalled();

    beforeEach(async () => {
      givenResolvedPackageId(packageId);
      await selectDefaultApp();
    });

    describe('in app launch (with dedicated arg)', () => {
      it('should prepare the device for receiving notification data file', async () => {
        await launchSelectedApp(notificationArgs);
        expect(fileXfer.prepareDestinationDir).toHaveBeenCalledWith(adbName);
      });

      it('should transfer the notification data file to the device', async () => {
        await launchSelectedApp(notificationArgs);
        expect(fileXfer.send).toHaveBeenCalledWith(adbName, notificationArgs.detoxUserNotificationDataURL, 'notification.json');
      });

      it('should not send the data if device prep fails', async () => {
        fileXfer.prepareDestinationDir.mockRejectedValue(new Error());
        await expect(launchSelectedApp(notificationArgs)).rejects.toThrowError();
      });

      it('should launch instrumentation with a modified notification data URL arg', async () => {
        fileXfer.send.mockReturnValue(mockNotificationDataTargetPath);

        await launchSelectedApp(notificationArgs);

        assertInstrumentationLaunchedWith({ detoxUserNotificationDataURL: mockNotificationDataTargetPath });
      });
    });

    [
      {
        description: 'in app launch when already running',
        applyFn: () => {
          mockInstrumentationRunning(defaultApp);
          return launchSelectedApp(notificationArgs);
        },
      },
      {
        description: 'via explicit payload-delivery call',
        applyFn: () => deliverPayloadToSelectedApp(notificationArgs),
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
        await uut.launchApp(packageId, {}, '');
        await uut.deliverPayload(notificationArgsDelayed);

        expect(fileXfer.send).not.toHaveBeenCalled();
      });

      it('should not start the app using invocation-manager', async () => {
        await uut.launchApp(packageId, {}, '');
        await uut.deliverPayload(notificationArgsDelayed, adbName);

        assertActivityStartNotInvoked();
      });
    });

  });

  describe('Device ready-wait', () => {

    beforeEach(async () => {
      givenResolvedPackageId(packageId);
      await selectDefaultApp();
    });

    it('should delegate wait to device being ready via client api', async () => {
      await uut._waitUntilReady(defaultApp);
      expect(defaultApp.client.waitUntilReady).toHaveBeenCalled();
    }, 2000);

    it('should fail if instrumentation async\'ly-dies prematurely while waiting for device-ready resolution', async () => {
      const crashError = new Error('mock instrumentation crash error');
      let waitForCrashReject = () => {};
      defaultApp.instrumentation.waitForCrash.mockImplementation(() => {
        return new Promise((__, reject) => {
          waitForCrashReject = reject;
        });
      });

      await launchSelectedApp();

      const clientWaitResolve = mockDeviceReadyPromise();
      const promise = uut._waitUntilReady(defaultApp);
      setTimeout(() => waitForCrashReject(crashError), 1);

      try {
        await expect(promise).rejects.toThrowError(crashError);
      } finally {
        clientWaitResolve();

      }
    }, 2000);

    it('should abort crash-wait if instrumentation doesnt crash', async () => {
      defaultApp.client.waitUntilReady.mockResolvedValue('mocked');
      await uut._waitUntilReady(defaultApp);
      expect(defaultApp.instrumentation.abortWaitForCrash).toHaveBeenCalled();
    });

    it('should abort crash-wait if instrumentation crashes', async () => {
      defaultApp.client.waitUntilReady.mockResolvedValue('mocked');
      defaultApp.instrumentation.waitForCrash.mockRejectedValue(new Error());

      try {
        await launchSelectedApp();
        fail();
      } catch (e) {
        expect(defaultApp.instrumentation.abortWaitForCrash).toHaveBeenCalled();
      }
    });

    const mockDeviceReadyPromise = () => {
      let clientResolve;
      defaultApp.client.waitUntilReady.mockReturnValue(new Promise((resolve) => clientResolve = resolve));
      return clientResolve;
    };
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

    jest.mock('fs-extra');
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

    eventEmitter = {
      emit: jest.fn(),
      off: jest.fn(),
    };

    jest.mock('../../../../android/espressoapi/Detox');
    detoxApi = require('../../../../android/espressoapi/Detox');
  };

  const setUpClassDepMocks = () => {
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

    defaultApp = createTestApp(1);
    secondaryApp = createTestApp(2);
    unspecifiedApp = createTestApp(0);
  };

  const createTestApp = (index) => {
    const app = {
      alias: `mock-alias-#${index}`,
      config: {
        binaryPath: `mock/path/${index}`,
      },
    };

    const Client = jest.genMockFromModule('../../../../client/Client');
    app.client = new Client();
    app.client.serverUrl = `ws://localhost:${detoxServerPortBase * index}`;

    const InvocationManager = jest.genMockFromModule('../../../../invoke').InvocationManager;
    app.invocationManager = new InvocationManager();

    class UiDeviceMock {
      constructor() {
        this.mockname = `uidevice${index}-mock`;
        this.pressBack = jest.fn();
        this.pressHome = jest.fn();
      }
    }
    app.uiDevice = new UiDeviceMock();

    jest.mock('../../../common/drivers/android/tools/MonitoredInstrumentation');
    const MonitoredInstrumentation = require('../../../common/drivers/android/tools/MonitoredInstrumentation');
    app.instrumentation = new MonitoredInstrumentation();
    mockInstrumentationDead(app);

    return app;
  };

  const createDriver = (apps) => {
    const unspecifiedAppDeps = _.pick(unspecifiedApp, ['client', 'invocationManager', 'uiDevice', 'instrumentation']);
    const AndroidDriver = require('./AndroidDriver');
    const deps = {
      ...unspecifiedAppDeps,
      apps,
      eventEmitter,
      adb,
      aapt,
      apkValidator,
      fileXfer,
      appInstallHelper,
      appUninstallHelper,
    };
    return new AndroidDriver(deps, { adbName });
  };
});
