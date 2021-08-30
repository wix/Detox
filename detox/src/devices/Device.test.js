const _ = require('lodash');

const configurationsMock = require('../configuration/configurations.mock');

describe('Device', () => {
  let fs;
  let DeviceDriverBase;
  let DetoxRuntimeErrorComposer;
  let errorComposer;
  let emitter;
  let Device;
  let argparse;
  let Client;
  let client;
  let driverMock;

  beforeEach(async () => {
    jest.mock('fs');
    jest.mock('../utils/logger');
    jest.mock('../utils/trace');

    fs = require('fs');

    jest.mock('../utils/argparse');
    argparse = require('../utils/argparse');

    jest.mock('./drivers/DeviceDriverBase');
    DeviceDriverBase = require('./drivers/DeviceDriverBase');

    jest.mock('../client/Client');
    Client = require('../client/Client');

    jest.mock('../utils/AsyncEmitter');
    const AsyncEmitter = require('../utils/AsyncEmitter');
    emitter = new AsyncEmitter({});
    DetoxRuntimeErrorComposer = require('../errors/DetoxRuntimeErrorComposer');

    Device = require('./Device');
  });

  beforeEach(async () => {
    fs.existsSync.mockReturnValue(true);

    client = new Client(configurationsMock.validSession);
    await client.connect();

    driverMock = new DeviceDriverMock();
  });

  class DeviceDriverMock {
    constructor() {
      this.driver = new DeviceDriverBase({
        client,
        emitter,
      });
    }

    expectExternalIdCalled(deviceId) {
      expect(this.driver.getExternalId).toHaveBeenCalledWith(deviceId);
    }

    expectLaunchCalledWithArgs(device, expectedArgs, languageAndLocale) {
      expect(this.driver.launchApp).toHaveBeenCalledWith(device.id, device._bundleId, expectedArgs, languageAndLocale);
    }

    expectLaunchCalledContainingArgs(device, expectedArgs) {
      expect(this.driver.launchApp).toHaveBeenCalledWith(
        device.id,
        this.driver.getBundleIdFromBinary(),
        expect.objectContaining(expectedArgs),
        undefined);
    }

    expectWaitForLaunchCalled(device, expectedArgs, languageAndLocale) {
      expect(this.driver.waitForAppLaunch).toHaveBeenCalledWith(device.id, device._bundleId, expectedArgs, languageAndLocale);
    }

    expectReinstallCalled() {
      expect(this.driver.uninstallApp).toHaveBeenCalled();
      expect(this.driver.installApp).toHaveBeenCalled();
    }

    expectReinstallNotCalled() {
      expect(this.driver.uninstallApp).not.toHaveBeenCalled();
      expect(this.driver.installApp).not.toHaveBeenCalled();
    }

    expectTerminateCalled() {
      expect(this.driver.terminate).toHaveBeenCalled();
    }

    expectTerminateNotCalled() {
      expect(this.driver.terminate).not.toHaveBeenCalled();
    }

    expectReverseTcpPortCalled(deviceId, port) {
      expect(this.driver.reverseTcpPort).toHaveBeenCalledWith(deviceId, port);
    }

    expectUnreverseTcpPortCalled(deviceId, port) {
      expect(this.driver.unreverseTcpPort).toHaveBeenCalledWith(deviceId, port);
    }
  }

  function aDevice(overrides) {
    const appsConfig = overrides.appsConfig || {};
    errorComposer = new DetoxRuntimeErrorComposer({ appsConfig });

    const device = new Device({
      appsConfig,
      behaviorConfig: {},
      deviceConfig: {},
      sessionConfig: {},
      deviceDriver: driverMock.driver,
      runtimeErrorComposer: errorComposer,
      emitter,

      ...overrides,
    });

    device.deviceDriver.getExternalId.mockImplementation((deviceId) => deviceId);
    device.deviceDriver.acquireFreeDevice.mockReturnValue('mockDeviceId');
    device.deviceDriver.getBundleIdFromBinary.mockReturnValue('test.bundle');
    return device;
  }

  function aValidUnpreparedDevice(overrides) {
    const configs = _.merge(_.cloneDeep({
      appsConfig: {
        default: configurationsMock.appWithRelativeBinaryPath,
      },
      deviceConfig: configurationsMock.iosSimulatorWithShorthandQuery,
      sessionConfig: configurationsMock.validSession,
    }), overrides);

    if (overrides && overrides.appsConfig === null) {
      configs.appsConfig = {};
    }

    return aDevice(configs);
  }

  async function aValidDevice(overrides) {
    const device = aValidUnpreparedDevice(overrides);
    await device.prepare();
    return device;
  }

  async function aValidDeviceWithLaunchArgs(launchArgs) {
    return await aValidDevice({
      appsConfig: {
        default: {
          launchArgs,
        },
      },
    });
  }

  it('should return the name from the driver', async () => {
    driverMock.driver.name = 'mock-device-name-from-driver';

    const device = await aValidDevice();
    expect(device.name).toEqual('mock-device-name-from-driver');
  });

  it('should return the type from the configuration', async () => {
    const device = await aValidDevice();
    expect(device.type).toEqual('ios.simulator');
  });

  it('should return an undefined ID for an unprepared device', async() => {
    const device = await aValidUnpreparedDevice();
    expect(device.id).toBeUndefined();
  });

  it('should return the device ID, as provided by acquireFreeDevice', async () => {
    const device = await aValidUnpreparedDevice();
    await device.prepare();

    driverMock.driver.getExternalId.mockReturnValue('mockExternalId');
    expect(device.id).toEqual('mockExternalId');

    driverMock.expectExternalIdCalled('mockDeviceId');
  });

  describe('selectApp()', () => {
    let device;

    describe('when there is a single app', () => {
      beforeEach(async () => {
        device = await aValidUnpreparedDevice();
        jest.spyOn(device, 'selectApp');
        await device.prepare();
      });

      it(`should select the default app upon prepare()`, async () => {
        expect(device.selectApp).toHaveBeenCalledWith('default');
      });

      it(`should function as usual when the app is selected`, async () => {
        await device.launchApp();
        expect(driverMock.driver.launchApp).toHaveBeenCalled();
      });

      it(`should throw on call without args`, async () => {
        await expect(device.selectApp()).rejects.toThrowError(errorComposer.cantSelectEmptyApp());
      });

      it(`should throw on app interactions with no selected app`, async () => {
        await device.selectApp(null);
        await expect(device.launchApp()).rejects.toThrowError(errorComposer.appNotSelected());
      });

      it(`should throw on attempt to select a non-existent app`, async () => {
        await expect(device.selectApp('nonExistent')).rejects.toThrowError();
      });
    });

    describe('when there are multiple apps', () => {
      beforeEach(async () => {
        device = await aValidUnpreparedDevice({
          appsConfig: {
            withBinaryPath: {
              binaryPath: 'path/to/app',
            },
            withBundleId: {
              binaryPath: 'path/to/app2',
              bundleId: 'com.app2'
            },
          },
        });

        jest.spyOn(device, 'selectApp');
        driverMock.driver.getBundleIdFromBinary.mockReturnValue('com.app1');

        await device.prepare();
      });

      it(`should not select the app at all`, async () => {
        expect(device.selectApp).not.toHaveBeenCalled();
      });

      it(`upon select, it should infer bundleId if it is missing`, async () => {
        await device.selectApp('withBinaryPath');
        expect(driverMock.driver.getBundleIdFromBinary).toHaveBeenCalledWith('path/to/app');
      });

      it(`upon select, it should terminate the previous app`, async () => {
        jest.spyOn(device, 'terminateApp');

        await device.selectApp('withBinaryPath');
        expect(device.terminateApp).not.toHaveBeenCalled(); // because no app was running before

        await device.selectApp('withBundleId');
        expect(device.terminateApp).toHaveBeenCalled(); // because there is a running app
      });

      it(`upon select, it should not infer bundleId if it is specified`, async () => {
        await device.selectApp('withBundleId');
        expect(driverMock.driver.getBundleIdFromBinary).not.toHaveBeenCalled();
      });

      it(`upon re-selecting the same app, it should not infer bundleId twice`, async () => {
        await device.selectApp('withBinaryPath');
        await device.selectApp('withBundleId');
        await device.selectApp('withBinaryPath');
        expect(driverMock.driver.getBundleIdFromBinary).toHaveBeenCalledTimes(1);
      });
    });

    describe('when there are no apps', () => {
      beforeEach(async () => {
        device = await aValidUnpreparedDevice({
          appsConfig: null
        });

        jest.spyOn(device, 'selectApp');
        await device.prepare();
      });

      it(`should not select the app at all`, async () => {
        expect(device.selectApp).not.toHaveBeenCalled();
      });

      it(`should be able to execute actions with an explicit bundleId`, async () => {
        const bundleId = 'com.example.app';
        jest.spyOn(device, 'terminateApp');

        await device.uninstallApp(bundleId);
        expect(driverMock.driver.uninstallApp).toHaveBeenCalledWith(device.id, bundleId);

        await device.installApp('/tmp/app', '/tmp/app-test');
        expect(driverMock.driver.installApp).toHaveBeenCalledWith(device.id, '/tmp/app', '/tmp/app-test');

        await device.launchApp({}, bundleId);
        expect(driverMock.driver.launchApp).toHaveBeenCalledWith(device.id, bundleId, expect.anything(), undefined);

        await device.terminateApp(bundleId);
        expect(driverMock.driver.terminate).toHaveBeenCalledWith(device.id, bundleId);

        await device.uninstallApp(bundleId);
        expect(driverMock.driver.uninstallApp).toHaveBeenCalledWith(device.id, bundleId);
      });
    });
  });

  describe('re/launchApp()', () => {
    const expectedDriverArgs = {
      'detoxServer': 'ws://localhost:8099',
      'detoxSessionId': 'test',
    };

    it(`with no args should launch app with defaults`, async () => {
      const expectedArgs = expectedDriverArgs;
      const device = await aValidDevice();
      await device.launchApp();

      driverMock.expectLaunchCalledWithArgs(device, expectedArgs);
    });

    it(`given behaviorConfig.launchApp == 'manual' should wait for the app launch`, async () => {
      const expectedArgs = expectedDriverArgs;
      const device = await aValidDevice({
        behaviorConfig: { launchApp: 'manual' }
      });
      await device.launchApp();

      expect(driverMock.driver.launchApp).not.toHaveBeenCalled();
      driverMock.expectWaitForLaunchCalled(device, expectedArgs);
    });

    it(`args should launch app and emit appReady`, async () => {
      driverMock.driver.launchApp = async () => 42;

      const device = await aValidDevice();
      await device.launchApp();

      expect(emitter.emit).toHaveBeenCalledWith('appReady', {
        deviceId: device.id,
        bundleId: device._bundleId,
        pid: 42,
      });
    });

    it(`(relaunch) with no args should use defaults`, async () => {
      const expectedArgs = expectedDriverArgs;
      const device = await aValidDevice();

      await device.relaunchApp();

      driverMock.expectLaunchCalledWithArgs(device, expectedArgs);
    });

    it(`(relaunch) with no args should terminate the app before launch - backwards compat`, async () => {
      const device = await aValidDevice();

      await device.relaunchApp();

      driverMock.expectTerminateCalled();
    });

    it(`(relaunch) with newInstance=false should not terminate the app before launch`, async () => {
      const device = await aValidDevice();

      await device.relaunchApp({ newInstance: false });

      driverMock.expectTerminateNotCalled();
    });

    it(`(relaunch) with newInstance=true should terminate the app before launch`, async () => {
      const device = await aValidDevice();

      await device.relaunchApp({ newInstance: true });

      driverMock.expectTerminateCalled();
    });

    it(`(relaunch) with delete=true`, async () => {
      const expectedArgs = expectedDriverArgs;
      const device = await aValidDevice();

      await device.relaunchApp({ delete: true });

      driverMock.expectReinstallCalled();
      driverMock.expectLaunchCalledWithArgs(device, expectedArgs);
    });

    it(`(relaunch) with delete=false when reuse is enabled should not uninstall and install`, async () => {
      const expectedArgs = expectedDriverArgs;
      const device = await aValidDevice();
      argparse.getArgValue.mockReturnValue(true);

      await device.relaunchApp();

      driverMock.expectReinstallNotCalled();
      driverMock.expectLaunchCalledWithArgs(device, expectedArgs);
    });

    it(`(relaunch) with url should send the url as a param in launchParams`, async () => {
      const expectedArgs = { ...expectedDriverArgs, 'detoxURLOverride': 'scheme://some.url' };
      const device = await aValidDevice();

      await device.relaunchApp({ url: `scheme://some.url` });

      driverMock.expectLaunchCalledWithArgs(device, expectedArgs);
    });

    it(`(relaunch) with url should send the url as a param in launchParams`, async () => {
      const expectedArgs = {
        ...expectedDriverArgs,
        'detoxURLOverride': 'scheme://some.url',
        'detoxSourceAppOverride': 'sourceAppBundleId',
      };
      const device = await aValidDevice();
      await device.relaunchApp({ url: `scheme://some.url`, sourceApp: 'sourceAppBundleId' });

      driverMock.expectLaunchCalledWithArgs(device, expectedArgs);
    });

    it(`(relaunch) with userNofitication should send the userNotification as a param in launchParams`, async () => {
      const expectedArgs = {
        ...expectedDriverArgs,
        'detoxUserNotificationDataURL': 'url',
      };
      const device = await aValidDevice();

      device.deviceDriver.createPayloadFile = jest.fn(() => 'url');

      await device.relaunchApp({ userNotification: 'json' });

      driverMock.expectLaunchCalledWithArgs(device, expectedArgs);
    });

    it(`(relaunch) with url and userNofitication should throw`, async () => {
      const device = await aValidDevice();
      try {
        await device.relaunchApp({ url: 'scheme://some.url', userNotification: 'notif' });
        fail('should fail');
      } catch (ex) {
        expect(ex).toBeDefined();
      }
    });

    it(`(relaunch) with permissions should send trigger setpermissions before app starts`, async () => {
      const device = await aValidDevice();
      await device.relaunchApp({ permissions: { calendar: 'YES' } });

      expect(driverMock.driver.setPermissions).toHaveBeenCalledWith(device.id, device._bundleId, { calendar: 'YES' });
    });

    it('with languageAndLocale should launch app with a specific language/locale', async () => {
      const expectedArgs = expectedDriverArgs;
      const device = await aValidDevice();

      const languageAndLocale = {
        language: 'es-MX',
        locale: 'es-MX'
      };

      await device.launchApp({ languageAndLocale });

      driverMock.expectLaunchCalledWithArgs(device, expectedArgs, languageAndLocale);
    });

    it(`with disableTouchIndicators should send a boolean switch as a param in launchParams`, async () => {
      const expectedArgs = { ...expectedDriverArgs, 'detoxDisableTouchIndicators': true };
      const device = await aValidDevice();

      await device.launchApp({ disableTouchIndicators: true });

      driverMock.expectLaunchCalledWithArgs(device, expectedArgs);
    });

    it(`with newInstance=false should check if process is in background and reopen it`, async () => {
      const processId = 1;
      const device = await aValidDevice();

      device.deviceDriver.launchApp.mockReturnValue(processId);

      await device.prepare();
      await device.launchApp({ newInstance: true });
      await device.launchApp({ newInstance: false });

      expect(driverMock.driver.deliverPayload).not.toHaveBeenCalled();
    });

    it(`with a url should check if process is in background and use openURL() instead of launch args`, async () => {
      const processId = 1;
      const device = await aValidDevice();
      device.deviceDriver.launchApp.mockReturnValue(processId);

      await device.prepare();
      await device.launchApp({ newInstance: true });
      await device.launchApp({ url: 'url://me' });

      expect(driverMock.driver.deliverPayload).toHaveBeenCalledTimes(1);
    });

    it(`with a url should check if process is in background and if not use launch args`, async () => {
      const launchParams = { url: 'url://me' };
      const processId = 1;
      const newProcessId = 2;

      const device = await aValidDevice();
      device.deviceDriver.launchApp.mockReturnValueOnce(processId).mockReturnValueOnce(newProcessId);

      await device.prepare();
      await device.launchApp(launchParams);

      expect(driverMock.driver.deliverPayload).not.toHaveBeenCalled();
    });

    it(`with a url should check if process is in background and use openURL() instead of launch args`, async () => {
      const launchParams = { url: 'url://me' };
      const processId = 1;

      const device = await aValidDevice();
      device.deviceDriver.launchApp.mockReturnValue(processId);

      await device.prepare();
      await device.launchApp({ newInstance: true });
      await device.launchApp(launchParams);

      expect(driverMock.driver.deliverPayload).toHaveBeenCalledWith({ delayPayload: true, url: 'url://me' });
    });

    it('with userActivity should check if process is in background and if it is use deliverPayload', async () => {
      const launchParams = { userActivity: 'userActivity' };
      const processId = 1;

      const device = await aValidDevice();
      device.deviceDriver.launchApp.mockReturnValueOnce(processId).mockReturnValueOnce(processId);
      device.deviceDriver.createPayloadFile = () => 'url';

      await device.prepare();
      await device.launchApp({ newInstance: true });
      await device.launchApp(launchParams);

      expect(driverMock.driver.deliverPayload).toHaveBeenCalledWith({ delayPayload: true, detoxUserActivityDataURL: 'url' });
    });

    it('with userNotification should check if process is in background and if it is use deliverPayload', async () => {
      const launchParams = { userNotification: 'notification' };
      const processId = 1;

      const device = await aValidDevice();
      device.deviceDriver.launchApp.mockReturnValueOnce(processId).mockReturnValueOnce(processId);
      device.deviceDriver.createPayloadFile = () => 'url';

      await device.prepare();
      await device.launchApp({ newInstance: true });
      await device.launchApp(launchParams);

      expect(driverMock.driver.deliverPayload).toHaveBeenCalledTimes(1);
    });

    it(`with userNotification should check if process is in background and if not use launch args`, async () => {
      const launchParams = { userNotification: 'notification' };
      const processId = 1;
      const newProcessId = 2;

      const device = await aValidDevice();
      device.deviceDriver.launchApp.mockReturnValueOnce(processId).mockReturnValueOnce(newProcessId);

      await device.prepare();
      await device.launchApp(launchParams);

      expect(driverMock.driver.deliverPayload).not.toHaveBeenCalled();
    });

    it(`with userNotification and url should fail`, async () => {
      const launchParams = { userNotification: 'notification', url: 'url://me' };
      const processId = 1;
      driverMock.driver.launchApp.mockReturnValueOnce(processId).mockReturnValueOnce(processId);

      const device = await aValidDevice();

      await device.prepare();

      try {
        await device.launchApp(launchParams);
        fail('should throw');
      } catch (ex) {
        expect(ex).toBeDefined();
      }

      expect(device.deviceDriver.deliverPayload).not.toHaveBeenCalled();
    });

    it('should keep user params unmodified', async () => {
      const params = {
        url: 'some.url',
        launchArgs: {
          some: 'userArg',
        }
      };
      const paramsClone = _.cloneDeep(params);

      const device = await aValidDevice();
      await device.launchApp(params);

      expect(params).toStrictEqual(paramsClone);
    });

    describe('launch arguments', () => {
      const baseArgs = {
        detoxServer: 'ws://localhost:8099',
        detoxSessionId: 'test',
      };
      const someLaunchArgs = () => ({
        argX: 'valX',
        argY: { value: 'Y' },
      });

      it('should pass preconfigured launch-args to device via driver', async () => {
        const launchArgs = someLaunchArgs();
        const device = await aValidDeviceWithLaunchArgs(launchArgs);
        await device.launchApp();

        driverMock.expectLaunchCalledContainingArgs(device, launchArgs);
      });

      it('should pass on-site launch-args to device via driver', async () => {
        const launchArgs = someLaunchArgs();
        const expectedArgs = {
          ...baseArgs,
          ...launchArgs,
        };

        const device = await aValidDevice();
        await device.launchApp({ launchArgs });

        driverMock.expectLaunchCalledWithArgs(device, expectedArgs);
      });

      it('should allow for launch-args modification', async () => {
        const launchArgs = someLaunchArgs();
        const argsModifier = {
          argY: null,
          argZ: 'valZ',
        };
        const expectedArgs = {
          argX: 'valX',
          argZ: 'valZ',
        };

        const device = await aValidDeviceWithLaunchArgs(launchArgs);
        device.appLaunchArgs.modify(argsModifier);
        await device.launchApp();

        driverMock.expectLaunchCalledContainingArgs(device, expectedArgs);
      });

      it('should override launch-args with on-site launch-args', async () => {
        const launchArgs = {
          aLaunchArg: 'aValue?',
        };

        const device = await aValidDeviceWithLaunchArgs();
        device.appLaunchArgs.modify(launchArgs);
        await device.launchApp({
          launchArgs: {
            aLaunchArg: 'aValue!',
          },
        });

        driverMock.expectLaunchCalledContainingArgs(device, { aLaunchArg: 'aValue!' });
      });

      it('should allow for resetting all args', async () => {
        const launchArgs = someLaunchArgs();
        const expectedArgs = { ...baseArgs };

        const device = await aValidDeviceWithLaunchArgs(launchArgs);
        device.appLaunchArgs.modify({ argZ: 'valZ' });
        device.appLaunchArgs.reset();
        await device.launchApp();

        driverMock.expectLaunchCalledWithArgs(device, expectedArgs);
      });
    });
  });

  describe('installApp()', () => {
    it(`with a custom app path should use custom app path`, async () => {
      const device = await aValidDevice();
      await device.installApp('newAppPath');
      expect(driverMock.driver.installApp).toHaveBeenCalledWith(device.id, 'newAppPath', device._deviceConfig.testBinaryPath);
    });

    it(`with a custom test app path should use custom test app path`, async () => {
      const device = await aValidDevice();
      await device.installApp('newAppPath', 'newTestAppPath');
      expect(driverMock.driver.installApp).toHaveBeenCalledWith(device.id, 'newAppPath', 'newTestAppPath');
    });

    it(`with no args should use the default path given in configuration`, async () => {
      const device = await aValidDevice();
      await device.installApp();
      expect(driverMock.driver.installApp).toHaveBeenCalledWith(device.id, device._currentApp.binaryPath, device._currentApp.testBinaryPath);
    });
  });

  describe('uninstallApp()', () => {
    it(`with a custom app path should use custom app path`, async () => {
      const device = await aValidDevice();
      await device.uninstallApp('newBundleId');
      expect(driverMock.driver.uninstallApp).toHaveBeenCalledWith(device.id, 'newBundleId');
    });

    it(`with no args should use the default path given in configuration`, async () => {
      const device = await aValidDevice();
      await device.uninstallApp();
      expect(driverMock.driver.uninstallApp).toHaveBeenCalledWith(device.id, device._bundleId);
    });
  });

  describe('installBinary()', () => {
    it('should install the set of util binaries', async () => {
      const device = await aValidDevice({
        deviceConfig: {
          utilBinaryPaths: ['path/to/util/binary']
        },
      });

      await device.installUtilBinaries();
      expect(driverMock.driver.installUtilBinaries).toHaveBeenCalledWith(
        device.id,
        ['path/to/util/binary'],
      );
    });

    it('should break if driver installation fails', async () => {
      driverMock.driver.installUtilBinaries.mockRejectedValue(new Error());

      const device = await aValidDevice({
        deviceConfig: {
          utilBinaryPaths: ['path/to/util/binary']
        },
      });

      await expect(device.installUtilBinaries()).rejects.toThrowError();
    });

    it('should not install anything if util-binaries havent been configured', async () => {
      const device = await aValidDevice({});

      await device.installUtilBinaries();
      expect(driverMock.driver.installUtilBinaries).not.toHaveBeenCalled();
    });
  });

  it(`sendToHome() should pass to device driver`, async () => {
    const device = await aValidDevice();
    await device.sendToHome();

    expect(driverMock.driver.sendToHome).toHaveBeenCalledTimes(1);
  });

  it(`setBiometricEnrollment(true) should pass YES to device driver`, async () => {
    const device = await aValidDevice();
    await device.setBiometricEnrollment(true);

    expect(driverMock.driver.setBiometricEnrollment).toHaveBeenCalledWith(device.id, 'YES');
    expect(driverMock.driver.setBiometricEnrollment).toHaveBeenCalledTimes(1);
  });

  it(`setBiometricEnrollment(false) should pass NO to device driver`, async () => {
    const device = await aValidDevice();
    await device.setBiometricEnrollment(false);

    expect(driverMock.driver.setBiometricEnrollment).toHaveBeenCalledWith(device.id, 'NO');
    expect(driverMock.driver.setBiometricEnrollment).toHaveBeenCalledTimes(1);
  });

  it(`matchFace() should pass to device driver`, async () => {
    const device = await aValidDevice();
    await device.matchFace();

    expect(driverMock.driver.matchFace).toHaveBeenCalledTimes(1);
  });

  it(`unmatchFace() should pass to device driver`, async () => {
    const device = await aValidDevice();
    await device.unmatchFace();

    expect(driverMock.driver.unmatchFace).toHaveBeenCalledTimes(1);
  });

  it(`matchFinger() should pass to device driver`, async () => {
    const device = await aValidDevice();
    await device.matchFinger();

    expect(driverMock.driver.matchFinger).toHaveBeenCalledTimes(1);
  });

  it(`unmatchFinger() should pass to device driver`, async () => {
    const device = await aValidDevice();
    await device.unmatchFinger();

    expect(driverMock.driver.unmatchFinger).toHaveBeenCalledTimes(1);
  });

  it(`setStatusBar() should pass to device driver`, async () => {
    const device = await aValidDevice();
    const params = {};
    await device.setStatusBar(params);

    expect(driverMock.driver.setStatusBar).toHaveBeenCalledWith(device.id, params);
  });

  it(`resetStatusBar() should pass to device driver`, async () => {
    const device = await aValidDevice();
    await device.resetStatusBar();

    expect(driverMock.driver.resetStatusBar).toHaveBeenCalledWith(device.id);
  });

  it(`_typeText() should pass to device driver`, async () => {
    const device = await aValidDevice();
    await device._typeText('Text');

    expect(driverMock.driver.typeText).toHaveBeenCalledWith(device.id, 'Text');
  });

  it(`shake() should pass to device driver`, async () => {
    const device = await aValidDevice();
    await device.shake();

    expect(driverMock.driver.shake).toHaveBeenCalledTimes(1);
  });

  it(`terminateApp() should pass to device driver`, async () => {
    const device = await aValidDevice();
    await device.terminateApp();

    expect(driverMock.driver.terminate).toHaveBeenCalledTimes(1);
  });

  it(`shutdown() should pass to device driver`, async () => {
    const device = await aValidDevice();
    await device.shutdown();

    expect(driverMock.driver.shutdown).toHaveBeenCalledTimes(1);
  });

  it(`openURL({url:url}) should pass to device driver`, async () => {
    const device = await aValidDevice();
    await device.openURL({ url: 'url' });

    expect(driverMock.driver.deliverPayload).toHaveBeenCalledWith({ url: 'url' }, device.id);
  });

  it(`openURL(notAnObject) should pass to device driver`, async () => {
    const device = await aValidDevice();
    try {
      await device.openURL('url');
      fail('should throw');
    } catch (ex) {
      expect(ex).toBeDefined();
    }
  });

  it(`reloadReactNative() should pass to device driver`, async () => {
    const device = await aValidDevice();
    await device.reloadReactNative();

    expect(driverMock.driver.reloadReactNative).toHaveBeenCalledTimes(1);
  });

  it(`setOrientation() should pass to device driver`, async () => {
    const device = await aValidDevice();
    await device.setOrientation('param');

    expect(driverMock.driver.setOrientation).toHaveBeenCalledWith(device.id, 'param');
  });

  it(`sendUserNotification() should pass to device driver`, async () => {
    const device = await aValidDevice();
    await device.sendUserNotification('notif');

    expect(driverMock.driver.createPayloadFile).toHaveBeenCalledTimes(1);
    expect(driverMock.driver.deliverPayload).toHaveBeenCalledTimes(1);
  });

  it(`sendUserActivity() should pass to device driver`, async () => {
    const device = await aValidDevice();
    await device.sendUserActivity('notif');

    expect(driverMock.driver.createPayloadFile).toHaveBeenCalledTimes(1);
    expect(driverMock.driver.deliverPayload).toHaveBeenCalledTimes(1);
  });

  it(`setLocation() should pass to device driver`, async () => {
    const device = await aValidDevice();
    await device.setLocation(30.1, 30.2);

    expect(driverMock.driver.setLocation).toHaveBeenCalledWith(device.id, '30.1', '30.2');
  });

  it(`reverseTcpPort should pass to device driver`, async () => {
    const device = await aValidDevice();
    await device.reverseTcpPort(666);

    await driverMock.expectReverseTcpPortCalled(device.id, 666);
  });

  it(`unreverseTcpPort should pass to device driver`, async () => {
    const device = await aValidDevice();
    await device.unreverseTcpPort(777);

    await driverMock.expectUnreverseTcpPortCalled(device.id, 777);
  });

  it(`setURLBlacklist() should pass to device driver`, async () => {
    const device = await aValidDevice();
    await device.setURLBlacklist();

    expect(driverMock.driver.setURLBlacklist).toHaveBeenCalledTimes(1);
  });

  it(`enableSynchronization() should pass to device driver`, async () => {
    const device = await aValidDevice();
    await device.enableSynchronization();

    expect(driverMock.driver.enableSynchronization).toHaveBeenCalledTimes(1);
  });

  it(`disableSynchronization() should pass to device driver`, async () => {
    const device = await aValidDevice();
    await device.disableSynchronization();

    expect(driverMock.driver.disableSynchronization).toHaveBeenCalledTimes(1);
  });

  it(`resetContentAndSettings() should pass to device driver`, async () => {
    const device = await aValidDevice();
    await device.resetContentAndSettings();

    expect(driverMock.driver.resetContentAndSettings).toHaveBeenCalledTimes(1);
  });

  it(`getPlatform() should pass to device driver`, async () => {
    const device = await aValidDevice();
    device.getPlatform();

    expect(driverMock.driver.getPlatform).toHaveBeenCalledTimes(1);
  });

  it(`_cleanup() should pass to device driver`, async () => {
    const device = await aValidDevice();
    await device._cleanup();

    expect(driverMock.driver.cleanup).toHaveBeenCalledTimes(1);
  });

  it(`should accept absolute path for binary`, async () => {
    const actualPath = await launchAndTestBinaryPath('absolute');
    expect(actualPath).toEqual(configurationsMock.appWithAbsoluteBinaryPath.binaryPath);
  });

  it(`should accept relative path for binary`, async () => {
    const actualPath = await launchAndTestBinaryPath('relative');
    expect(actualPath).toEqual(configurationsMock.appWithRelativeBinaryPath.binaryPath);
  });

  it(`pressBack() should invoke driver's pressBack()`, async () => {
    const device = await aValidDevice();

    await device.pressBack();

    expect(driverMock.driver.pressBack).toHaveBeenCalledWith(device.id);
  });

  it(`clearKeychain() should invoke driver's clearKeychain()`, async () => {
    const device = await aValidDevice();

    await device.clearKeychain();

    expect(driverMock.driver.clearKeychain).toHaveBeenCalledWith(device.id);
  });

  describe('get ui device', () => {
    it(`getUiDevice should invoke driver's getUiDevice`, async () => {
      const device = await aValidDevice();

      await device.getUiDevice();

      expect(driverMock.driver.getUiDevice).toHaveBeenCalled();
    });

    it('should call return UiDevice when call getUiDevice', async () => {
      const uiDevice = {
        uidevice: true,
      };

      const device = await aValidDevice();
      driverMock.driver.getUiDevice = () =>  uiDevice;

      const result = await device.getUiDevice();

      expect(result).toEqual(uiDevice);
    });
  });

  it('takeScreenshot(name) should throw an exception if given name is empty', async () => {
    await expect((await aValidDevice()).takeScreenshot()).rejects.toThrowError(/empty name/);
  });

  it('takeScreenshot(name) should delegate the work to the driver', async () => {
    const device = await aValidDevice();

    await device.takeScreenshot('name');
    expect(device.deviceDriver.takeScreenshot).toHaveBeenCalledWith(device.id, 'name');
  });

  it('captureViewHierarchy(name) should delegate the work to the driver', async () => {
    const device = await aValidDevice();

    await device.captureViewHierarchy('name');
    expect(device.deviceDriver.captureViewHierarchy).toHaveBeenCalledWith(device.id, 'name');
  });

  it('captureViewHierarchy([name]) should set name = "capture" by default', async () => {
    const device = await aValidDevice();

    await device.captureViewHierarchy();
    expect(device.deviceDriver.captureViewHierarchy).toHaveBeenCalledWith(device.id, 'capture');
  });

  describe('_isAppRunning (internal method)', () => {
    let device;

    beforeEach(async () => {
      device = await aValidDevice();
      driverMock.driver.launchApp = async () => 42;
      await device.launchApp();
    });

    it('should return the value for the current app if called with no args', async () => {
      expect(device._isAppRunning()).toBe(true);
    });

    it('should return the value for the given bundleId', async () => {
      expect(device._isAppRunning('test.bundle')).toBe(true);
      expect(device._isAppRunning('somethingElse')).toBe(false);
    });
  });

  async function launchAndTestBinaryPath(absoluteOrRelative) {
    const appConfig = absoluteOrRelative === 'absolute'
      ? configurationsMock.appWithAbsoluteBinaryPath
      : configurationsMock.appWithRelativeBinaryPath;

    const device = await aValidDevice({ appsConfig: { default: appConfig } });
    await device.installApp();

    return driverMock.driver.installApp.mock.calls[0][1];
  }
});
