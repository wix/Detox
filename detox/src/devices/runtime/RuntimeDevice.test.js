// @ts-nocheck
const _ = require('lodash');

const configurationsMock = require('../../configuration/configurations.mock');
const DEFAULT_APP_ALIAS = 'default';

describe('Device', () => {
  const bundleId = 'test.bundle';

  let DeviceDriverBase;
  let DetoxRuntimeErrorComposer;
  let errorComposer;
  let emitter;
  let RuntimeDevice;
  let argparse;
  let Client;
  let client;
  let driverMock;

  beforeEach(async () => {
    jest.mock('../../utils/logger');
    jest.mock('../../utils/trace');

    jest.mock('../../utils/argparse');
    argparse = require('../../utils/argparse');

    jest.mock('./drivers/DeviceDriverBase');
    DeviceDriverBase = require('./drivers/DeviceDriverBase');

    jest.mock('../../client/Client');
    Client = require('../../client/Client');

    jest.mock('../../utils/AsyncEmitter');
    const AsyncEmitter = require('../../utils/AsyncEmitter');
    emitter = new AsyncEmitter({});
    DetoxRuntimeErrorComposer = require('../../errors/DetoxRuntimeErrorComposer');

    RuntimeDevice = require('./RuntimeDevice');
  });

  beforeEach(async () => {
    client = new Client(configurationsMock.validSession);
    await client.connect();

    driverMock = new DeviceDriverMock(DeviceDriverBase, { emitter, client });
    driverMock.givenNoSelectedApp();
    driverMock.driver.selectApp.mockImplementation((appAlias) => driverMock.givenAppSelection(appAlias));
    driverMock.driver.selectedApp = DEFAULT_APP_ALIAS;
  });

  function aDevice(overrides) {
    const appsConfig = overrides.appsConfig || {};
    errorComposer = new DetoxRuntimeErrorComposer({ appsConfig });

    return new RuntimeDevice({
      appsConfig,
      behaviorConfig: {},
      deviceConfig: {},
      sessionConfig: {},
      runtimeErrorComposer: errorComposer,
      eventEmitter: emitter,

      ...overrides,
    }, driverMock.driver);
  }

  function aValidUnpreparedDevice(overrides) {
    const configs = _.merge(_.cloneDeep({
      appsConfig: {
        [DEFAULT_APP_ALIAS]: configurationsMock.appWithRelativeBinaryPath,
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
    await device._prepare();
    return device;
  }

  async function aValidDeviceWithLaunchArgs(launchArgs) {
    return await aValidDevice({
      appsConfig: {
        [DEFAULT_APP_ALIAS]: {
          launchArgs,
        },
      },
    });
  }

  it('should return the name from the driver', async () => {
    const deviceName = 'mock-device-name-from-driver';
    driverMock.givenDeviceName(deviceName);

    const device = await aValidDevice();
    expect(device.name).toEqual(deviceName);
  });

  it('should return the type from the configuration', async () => {
    const device = await aValidDevice();
    expect(device.type).toEqual('ios.simulator');
  });

  it('should return the device ID, as provided by acquireFreeDevice', async () => {
    const device = await aValidUnpreparedDevice();
    await device._prepare();

    driverMock.driver.getExternalId.mockReturnValue('mockExternalId');
    expect(device.id).toEqual('mockExternalId');

    driverMock.expectExternalIdCalled();
  });

  it('should prepare the driver', async () => {
    const device = await aValidUnpreparedDevice();
    await device._prepare();

    expect(driverMock.driver.prepare).toHaveBeenCalled();
  });

  describe('selectApp()', () => {
    let device;

    describe('when there is a single preconfigured app', () => {
      beforeEach(async () => {
        device = await aValidUnpreparedDevice();
        jest.spyOn(device, 'selectApp');
        await device._prepare();
      });

      it(`should select the default app upon prepare()`, async () => {
        expect(device.selectApp).toHaveBeenCalledWith(DEFAULT_APP_ALIAS);
      });

      it(`should function as usual when the app is selected`, async () => {
        await device.launchApp();
        expect(driverMock.driver.launchApp).toHaveBeenCalled();
      });

      it(`should throw on call without args`, async () => {
        await expect(device.selectApp()).rejects.toThrowError(errorComposer.cantSelectEmptyApp());
      });

      it(`should throw on attempt to select a non-existent app`, async () => {
        await expect(device.selectApp('nonExistent')).rejects.toThrowError();
      });
    });

    describe('when there are multiple apps', () => {
      const anAppAlias = 'cfgWithBinaryPath';
      const otherAppAlias = 'cfgWithBundleId';

      beforeEach(async () => {
        device = await aValidUnpreparedDevice({
          appsConfig: {
            [anAppAlias]: {
              binaryPath: 'path/to/app',
            },
            [otherAppAlias]: {
              binaryPath: 'path/to/app2',
              bundleId: 'com.app2'
            },
          },
        });
        jest.spyOn(device, 'selectApp');

        await device._prepare();
      });

      it(`should not select the app at all`, async () => {
        expect(device.selectApp).not.toHaveBeenCalled();
      });

      it(`should select an app in the driver`, async () => {
        await device.selectApp(anAppAlias);
        driverMock.expectSelectedAppCalled(anAppAlias);
      });

      it(`should not select the app in the driver if given invalid alias`, async () => {
        try {
          await device.selectApp(undefined);
        } catch (e) {}
        try {
          await device.selectApp(null);
        } catch (e) {}

        driverMock.expectSelectedAppNotCalled();
      });

      it(`should not select the app in the driver if given unknown alias`, async () => {
        try {
          await device.selectApp('asdasd');
        } catch(e) {}
        driverMock.expectSelectedAppNotCalled();
      });

      it(`should allow for selection of an (unspecified) app configuration object`, async () => {
        const appConfig = {
          appId: bundleId,
          binaryPath: 'proper/path',
        };

        await device.selectApp(appConfig);

        driverMock.expectSelectUnspecifiedAppCalled(appConfig);
      });
    });

    describe('when there are no apps', () => {
      beforeEach(async () => {
        device = await aValidUnpreparedDevice({
          appsConfig: null
        });

        jest.spyOn(device, 'selectApp');
        await device._prepare();
      });

      it(`should not select the app at all`, async () => {
        expect(device.selectApp).not.toHaveBeenCalled();
      });

      it(`should be able to execute actions based on the selected app`, async () => {
        await device.uninstallApp(DEFAULT_APP_ALIAS);
        expect(driverMock.driver.uninstallApp).toHaveBeenCalledWith(DEFAULT_APP_ALIAS);

        await device.installApp(DEFAULT_APP_ALIAS);
        expect(driverMock.driver.installApp).toHaveBeenCalledWith(DEFAULT_APP_ALIAS);

        await device.launchApp({});
        expect(driverMock.driver.launchApp).toHaveBeenCalledWith({}, undefined, DEFAULT_APP_ALIAS);

        await device.terminateApp(DEFAULT_APP_ALIAS);
        expect(driverMock.driver.terminateApp).toHaveBeenCalledWith(DEFAULT_APP_ALIAS);

        await device.uninstallApp(DEFAULT_APP_ALIAS);
        expect(driverMock.driver.uninstallApp).toHaveBeenCalledWith(DEFAULT_APP_ALIAS);
      });
    });
  });

  describe('re/launchApp()', () => {
    it(`with no args should launch app with defaults`, async () => {
      const expectedArgs = {};
      const device = await aValidDevice();
      await device.launchApp();

      driverMock.expectLaunchCalledWithArgs(DEFAULT_APP_ALIAS, expectedArgs);
    });

    it(`given behaviorConfig.launchApp == 'manual' should wait for the app launch`, async () => {
      const expectedArgs = {};
      const device = await aValidDevice({
        behaviorConfig: { launchApp: 'manual' }
      });
      await device.launchApp();

      expect(driverMock.driver.launchApp).not.toHaveBeenCalled();
      driverMock.expectWaitForLaunchCalled(DEFAULT_APP_ALIAS, expectedArgs);
    });

    it(`(relaunch) with no args should use defaults`, async () => {
      const expectedArgs = {};
      const device = await aValidDevice();

      await device.relaunchApp();

      driverMock.expectLaunchCalledWithArgs(DEFAULT_APP_ALIAS, expectedArgs);
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
      const expectedArgs = {};
      const device = await aValidDevice();

      await device.relaunchApp({ delete: true });

      driverMock.expectReinstallCalled();
      driverMock.expectLaunchCalledWithArgs(DEFAULT_APP_ALIAS, expectedArgs);
    });

    it(`(relaunch) with delete=false when reuse is enabled should not uninstall and install`, async () => {
      const expectedArgs = {};
      const device = await aValidDevice();
      argparse.getArgValue.mockReturnValue(true);

      await device.relaunchApp();

      driverMock.expectReinstallNotCalled();
      driverMock.expectLaunchCalledWithArgs(DEFAULT_APP_ALIAS, expectedArgs);
    });

    it(`(relaunch) with url should send the url as a param in launchParams`, async () => {
      const expectedArgs = { 'detoxURLOverride': 'scheme://some.url' };
      const device = await aValidDevice();

      await device.relaunchApp({ url: `scheme://some.url` });

      driverMock.expectLaunchCalledWithArgs(DEFAULT_APP_ALIAS, expectedArgs);
    });

    it(`(relaunch) with url should send the url as a param in launchParams`, async () => {
      const expectedArgs = {
        'detoxURLOverride': 'scheme://some.url',
        'detoxSourceAppOverride': 'sourceAppBundleId',
      };
      const device = await aValidDevice();
      await device.relaunchApp({ url: `scheme://some.url`, sourceApp: 'sourceAppBundleId' });

      driverMock.expectLaunchCalledWithArgs(DEFAULT_APP_ALIAS, expectedArgs);
    });

    it(`(relaunch) with userNofitication should send the userNotification as a param in launchParams`, async () => {
      const expectedArgs = {
        'detoxUserNotificationDataURL': 'url',
      };
      const device = await aValidDevice();

      device.deviceDriver.createPayloadFile = jest.fn(() => 'url');

      await device.relaunchApp({ userNotification: 'json' });

      driverMock.expectLaunchCalledWithArgs(DEFAULT_APP_ALIAS, expectedArgs);
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

      expect(driverMock.driver.setPermissions).toHaveBeenCalledWith({ calendar: 'YES' }, DEFAULT_APP_ALIAS);
    });

    it('with languageAndLocale should launch app with a specific language/locale', async () => {
      const expectedArgs = {};
      const device = await aValidDevice();

      const languageAndLocale = {
        language: 'es-MX',
        locale: 'es-MX'
      };

      await device.launchApp({ languageAndLocale });

      driverMock.expectLaunchCalledWithArgs(DEFAULT_APP_ALIAS, expectedArgs, languageAndLocale);
    });

    it(`with disableTouchIndicators should send a boolean switch as a param in launchParams`, async () => {
      const expectedArgs = { 'detoxDisableTouchIndicators': true };
      const device = await aValidDevice();

      await device.launchApp({ disableTouchIndicators: true });

      driverMock.expectLaunchCalledWithArgs(DEFAULT_APP_ALIAS, expectedArgs);
    });

    it(`with newInstance=false should check if app is running and reopen it`, async () => {
      driverMock.givenAppRunState(false);

      const device = await aValidDevice();

      await device._prepare();
      await device.launchApp({ newInstance: true });
      await device.launchApp({ newInstance: false });

      expect(driverMock.driver.deliverPayload).not.toHaveBeenCalled();
      expect(driverMock.driver.isAppRunning).toHaveBeenCalledWith(DEFAULT_APP_ALIAS);
    });

    it(`with a url should check if app is in running and use openURL() instead of launch args`, async () => {
      driverMock.givenAppRunState(true);

      const device = await aValidDevice();

      await device._prepare();
      await device.launchApp({ newInstance: true });
      await device.launchApp({ url: 'url://me' });

      expect(driverMock.driver.deliverPayload).toHaveBeenCalledTimes(1);
    });

    it(`with a url should check if app is in running and use openURL() instead of launch args`, async () => {
      driverMock.givenAppRunState(true);

      const launchParams = { url: 'url://me' };
      const device = await aValidDevice();

      await device._prepare();
      await device.launchApp({ newInstance: true });
      await device.launchApp(launchParams);

      expect(driverMock.driver.deliverPayload).toHaveBeenCalledWith({ delayPayload: true, url: 'url://me' });
    });

    it('with userActivity should check if app is in running and if so use deliverPayload', async () => {
      driverMock.givenAppRunState(true);

      const launchParams = { userActivity: 'userActivity' };
      const device = await aValidDevice();
      device.deviceDriver.createPayloadFile = () => 'url';

      await device._prepare();
      await device.launchApp({ newInstance: true });
      await device.launchApp(launchParams);

      expect(driverMock.driver.deliverPayload).toHaveBeenCalledWith({ delayPayload: true, detoxUserActivityDataURL: 'url' });
    });

    it('with userNotification should check if process is in background and if it is use deliverPayload', async () => {
      driverMock.givenAppRunState(true);

      const launchParams = { userNotification: 'notification' };
      const device = await aValidDevice();
      device.deviceDriver.createPayloadFile = () => 'url';

      await device._prepare();
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

      await device._prepare();
      await device.launchApp(launchParams);

      expect(driverMock.driver.deliverPayload).not.toHaveBeenCalled();
    });

    it(`with userNotification and url should fail`, async () => {
      const launchParams = { userNotification: 'notification', url: 'url://me' };
      const processId = 1;
      driverMock.driver.launchApp.mockReturnValueOnce(processId).mockReturnValueOnce(processId);

      const device = await aValidDevice();

      await device._prepare();

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
      const someLaunchArgs = () => ({
        argX: 'valX',
        argY: { value: 'Y' },
      });

      it('should pass preconfigured launch-args to device via driver', async () => {
        const launchArgs = someLaunchArgs();
        const device = await aValidDeviceWithLaunchArgs(launchArgs);
        await device.launchApp();

        driverMock.expectLaunchCalledContainingArgs(DEFAULT_APP_ALIAS, launchArgs);
      });

      it('should pass on-site launch-args to device via driver', async () => {
        const launchArgs = someLaunchArgs();
        const expectedArgs = {
          ...launchArgs,
        };

        const device = await aValidDevice();
        await device.launchApp({ launchArgs });

        driverMock.expectLaunchCalledContainingArgs(DEFAULT_APP_ALIAS, expectedArgs);
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

        driverMock.expectLaunchCalledContainingArgs(DEFAULT_APP_ALIAS, expectedArgs);
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

        driverMock.expectLaunchCalledContainingArgs(DEFAULT_APP_ALIAS, { aLaunchArg: 'aValue!' });
      });

      it('should allow for resetting all args', async () => {
        const launchArgs = someLaunchArgs();
        const expectedArgs = {};

        const device = await aValidDeviceWithLaunchArgs(launchArgs);
        device.appLaunchArgs.modify({ argZ: 'valZ' });
        device.appLaunchArgs.reset();
        await device.launchApp();

        driverMock.expectLaunchCalledWithArgs(DEFAULT_APP_ALIAS, expectedArgs);
      });
    });
  });

  describe('installApp()', () => {
    it(`should pass-through alias to driver`, async () => {
      const device = await aValidDevice();

      await device.installApp(DEFAULT_APP_ALIAS);
      expect(driverMock.driver.installApp).toHaveBeenCalledWith(DEFAULT_APP_ALIAS);
    });
  });

  describe('uninstallApp()', () => {
    it(`should pass-through alias to driver`, async () => {
      const device = await aValidDevice();

      await device.uninstallApp(DEFAULT_APP_ALIAS);
      expect(driverMock.driver.uninstallApp).toHaveBeenCalledWith(DEFAULT_APP_ALIAS);
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
      expect(driverMock.driver.installUtilBinaries).toHaveBeenCalledWith(['path/to/util/binary']);
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

    expect(driverMock.driver.setBiometricEnrollment).toHaveBeenCalledWith('YES');
    expect(driverMock.driver.setBiometricEnrollment).toHaveBeenCalledTimes(1);
  });

  it(`setBiometricEnrollment(false) should pass NO to device driver`, async () => {
    const device = await aValidDevice();
    await device.setBiometricEnrollment(false);

    expect(driverMock.driver.setBiometricEnrollment).toHaveBeenCalledWith('NO');
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

    expect(driverMock.driver.setStatusBar).toHaveBeenCalledWith(params);
  });

  it(`resetStatusBar() should pass to device driver`, async () => {
    const device = await aValidDevice();
    await device.resetStatusBar();

    expect(driverMock.driver.resetStatusBar).toHaveBeenCalledWith();
  });

  it(`shake() should pass to device driver`, async () => {
    const device = await aValidDevice();
    await device.shake();

    expect(driverMock.driver.shake).toHaveBeenCalledTimes(1);
  });

  it(`terminateApp() should pass to device driver`, async () => {
    const device = await aValidDevice();
    await device.terminateApp(DEFAULT_APP_ALIAS);

    expect(driverMock.driver.terminateApp).toHaveBeenCalledWith(DEFAULT_APP_ALIAS);
  });

  it(`openURL({url:url}) should pass to device driver`, async () => {
    const device = await aValidDevice();
    await device.openURL({ url: 'url' });

    expect(driverMock.driver.deliverPayload).toHaveBeenCalledWith({ url: 'url' });
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

    expect(driverMock.driver.setOrientation).toHaveBeenCalledWith('param');
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

    expect(driverMock.driver.setLocation).toHaveBeenCalledWith('30.1', '30.2');
  });

  it(`reverseTcpPort should pass to device driver`, async () => {
    const device = await aValidDevice();
    await device.reverseTcpPort(666);

    await driverMock.expectReverseTcpPortCalled(666);
  });

  it(`unreverseTcpPort should pass to device driver`, async () => {
    const device = await aValidDevice();
    await device.unreverseTcpPort(777);

    await driverMock.expectUnreverseTcpPortCalled(777);
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

  it(`pressBack() should invoke driver's pressBack()`, async () => {
    const device = await aValidDevice();

    await device.pressBack();

    expect(driverMock.driver.pressBack).toHaveBeenCalledWith();
  });

  it(`clearKeychain() should invoke driver's clearKeychain()`, async () => {
    const device = await aValidDevice();

    await device.clearKeychain();

    expect(driverMock.driver.clearKeychain).toHaveBeenCalledWith();
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
    expect(device.deviceDriver.takeScreenshot).toHaveBeenCalledWith('name');
  });

  it('captureViewHierarchy(name) should delegate the work to the driver', async () => {
    const device = await aValidDevice();

    await device.captureViewHierarchy('name');
    expect(device.deviceDriver.captureViewHierarchy).toHaveBeenCalledWith('name');
  });

  it('captureViewHierarchy([name]) should set name = "capture" by default', async () => {
    const device = await aValidDevice();

    await device.captureViewHierarchy();
    expect(device.deviceDriver.captureViewHierarchy).toHaveBeenCalledWith('capture');
  });
});

class DeviceDriverMock {
  constructor(DeviceDriverBase, { emitter, client }) {
    this.driver = new DeviceDriverBase({
      client,
      emitter,
    });
  }

  expectExternalIdCalled() {
    expect(this.driver.getExternalId).toHaveBeenCalled();
  }

  expectLaunchCalledWithArgs(appAlias, expectedArgs, languageAndLocale) {
    expect(this.driver.launchApp).toHaveBeenCalledWith(expectedArgs, languageAndLocale, appAlias);
  }

  expectLaunchCalledContainingArgs(appAlias, expectedArgs) {
    expect(this.driver.launchApp).toHaveBeenCalledWith(expect.objectContaining(expectedArgs), undefined, appAlias);
  }

  expectWaitForLaunchCalled(appAlias, expectedArgs, languageAndLocale) {
    expect(this.driver.waitForAppLaunch).toHaveBeenCalledWith(expectedArgs, languageAndLocale, appAlias);
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
    expect(this.driver.terminateApp).toHaveBeenCalled();
  }

  expectTerminateNotCalled() {
    expect(this.driver.terminateApp).not.toHaveBeenCalled();
  }

  expectReverseTcpPortCalled(port) {
    expect(this.driver.reverseTcpPort).toHaveBeenCalledWith(port);
  }

  expectUnreverseTcpPortCalled(port) {
    expect(this.driver.unreverseTcpPort).toHaveBeenCalledWith(port);
  }

  expectSelectedAppCalled(appAlias) {
    expect(this.driver.selectApp).toHaveBeenCalledWith(appAlias);
  }

  expectSelectedAppNotCalled() {
    expect(this.driver.selectApp).not.toHaveBeenCalled();
  }

  expectSelectUnspecifiedAppCalled(appConfig) {
    expect(this.driver.selectUnspecifiedApp).toHaveBeenCalledWith(appConfig);
  }

  givenDefaultAppSelection() {
    this.givenAppSelection(DEFAULT_APP_ALIAS);
  }

  givenAppSelection(appAlias) {
    this.driver.selectedApp = appAlias;
  }

  givenNoSelectedApp() {
    this.driver.selectedApp = null;
  }

  givenDeviceName(name) {
    this.driver.getDeviceName.mockReturnValue(name);
  }

  givenAppRunState(state) {
    this.driver.isAppRunning.mockReturnValue(state);
  }
}
