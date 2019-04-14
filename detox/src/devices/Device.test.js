const _ = require('lodash');
const path = require('path');
const configurationsMock = require('../configurations.mock');

const validScheme = configurationsMock.validOneDeviceAndSession;
const invalidDeviceNoBinary = configurationsMock.invalidDeviceNoBinary;
const invalidDeviceNoDeviceName = configurationsMock.invalidDeviceNoDeviceName;

describe('Device', () => {
  let fs;
  let DeviceDriverBase;
  let SimulatorDriver;
  let Device;
  let argparse;
  let Client;
  let client;
  let driverMock;

  beforeEach(async () => {
    jest.mock('fs');
    jest.mock('proper-lockfile');
    jest.mock('../utils/logger');

    fs = require('fs');

    jest.mock('../utils/argparse');
    argparse = require('../utils/argparse');

    jest.mock('./drivers/DeviceDriverBase');
    DeviceDriverBase = require('./drivers/DeviceDriverBase');

    SimulatorDriver = require('./drivers/SimulatorDriver');

    jest.mock('../client/Client');
    Client = require('../client/Client');

    Device = require('./Device');
  });

  beforeEach(async () => {
    fs.existsSync.mockReturnValue(true);

    client = new Client(validScheme.session);
    await client.connect();

    driverMock = new DeviceDriverMock();
  });

  class DeviceDriverMock {
    constructor() {
      this.driver = new DeviceDriverBase(client);
    }

    expectLaunchCalled(device, expectedArgs, languageAndLocale) {
      expect(this.driver.launchApp).toHaveBeenCalledWith(device._deviceId, device._bundleId, expectedArgs, languageAndLocale);
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
  }

  function schemeDevice(scheme, configuration) {
    const device = new Device({
      deviceConfig: scheme.configurations[configuration],
      deviceDriver: driverMock.driver,
      sessionConfig: scheme.session,
    });

    device.deviceDriver.defaultLaunchArgsPrefix.mockReturnValue('-');
    device.deviceDriver.acquireFreeDevice.mockReturnValue('mockDeviceId');

    return device;
  }

  function validDevice() {
    return schemeDevice(validScheme, 'ios.sim.release');
  }

  describe('prepare()', () => {
    it(`valid scheme, no binary, should throw`, async () => {
      const device = validDevice();
      fs.existsSync.mockReturnValue(false);
      try {
        await device.prepare();
        fail('should throw')
      } catch (ex) {
        expect(ex.message).toMatch(/app binary not found at/)
      }
    });

    it(`valid scheme, no binary, should not throw`, async () => {
      const device = validDevice();
      await device.prepare();
    });

    it(`when reuse is enabled in CLI args should not uninstall and install`, async () => {
      const device = validDevice();
      argparse.getArgValue.mockReturnValue(true);

      await device.prepare();

      expect(driverMock.driver.uninstallApp).not.toHaveBeenCalled();
      expect(driverMock.driver.installApp).not.toHaveBeenCalled();
    });

    it(`when reuse is enabled in params should not uninstall and install`, async () => {
      const device = validDevice();

      await device.prepare({reuse: true});

      expect(driverMock.driver.uninstallApp).not.toHaveBeenCalled();
      expect(driverMock.driver.installApp).not.toHaveBeenCalled();
    });
  });

  describe('re/launchApp()', () => {
    const expectedDriverArgs = {
      "-detoxServer": "ws://localhost:8099",
      "-detoxSessionId": "test",
    };

    it(`with no args should launch app with defaults`, async () => {
      const expectedArgs = expectedDriverArgs;
      const device = validDevice();
      await device.launchApp();

      driverMock.expectLaunchCalled(device, expectedArgs);
    });

    it(`(relaunch) with no args should use defaults`, async () => {
      const expectedArgs = expectedDriverArgs;
      const device = validDevice();

      await device.relaunchApp();

      driverMock.expectLaunchCalled(device, expectedArgs);
    });

    it(`(relaunch) with no args should terminate the app before launch - backwards compat`, async () => {
      const device = validDevice();

      await device.relaunchApp();

      driverMock.expectTerminateCalled();
    });

    it(`(relaunch) with newInstance=false should not terminate the app before launch`, async () => {
      const device = validDevice();

      await device.relaunchApp({newInstance: false});

      driverMock.expectTerminateNotCalled();
    });

    it(`(relaunch) with newInstance=true should terminate the app before launch`, async () => {
      const device = validDevice();

      await device.relaunchApp({newInstance: true});

      driverMock.expectTerminateCalled();
    });

    it(`(relaunch) with delete=true`, async () => {
      const expectedArgs = expectedDriverArgs;
      const device = validDevice();

      await device.relaunchApp({delete: true});

      driverMock.expectReinstallCalled();
      driverMock.expectLaunchCalled(device, expectedArgs);
    });

    it(`(relaunch) with delete=false when reuse is enabled should not uninstall and install`, async () => {
      const expectedArgs = expectedDriverArgs;
      const device = validDevice();
      argparse.getArgValue.mockReturnValue(true);

      await device.relaunchApp();

      driverMock.expectReinstallNotCalled();
      driverMock.expectLaunchCalled(device, expectedArgs);
    });

    it(`(relaunch) with url should send the url as a param in launchParams`, async () => {
      const expectedArgs = {...expectedDriverArgs, "-detoxURLOverride": "scheme://some.url"};
      const device = await validDevice();

      await device.relaunchApp({url: `scheme://some.url`});

      driverMock.expectLaunchCalled(device, expectedArgs);
    });

    it(`(relaunch) with url should send the url as a param in launchParams`, async () => {
      const expectedArgs = {
        ...expectedDriverArgs,
        "-detoxURLOverride": "scheme://some.url",
        "-detoxSourceAppOverride": "sourceAppBundleId",
      };
      const device = await validDevice();
      await device.relaunchApp({url: `scheme://some.url`, sourceApp: 'sourceAppBundleId'});

      driverMock.expectLaunchCalled(device, expectedArgs);
    });

    it(`(relaunch) with userNofitication should send the userNotification as a param in launchParams`, async () => {
      const expectedArgs = {
        ...expectedDriverArgs,
        "-detoxUserNotificationDataURL": "url",
      };
      const device = validDevice();

      device.deviceDriver.createPayloadFile = jest.fn(() => 'url');

      await device.relaunchApp({userNotification: 'json'});

      driverMock.expectLaunchCalled(device, expectedArgs);
    });

    it(`(relaunch) with url and userNofitication should throw`, async () => {
      const device = validDevice();
      try {
        await device.relaunchApp({url: "scheme://some.url", userNotification: 'notif'});
        fail('should fail');
      } catch (ex) {
        expect(ex).toBeDefined();
      }
    });

    it(`(relaunch) with permissions should send trigger setpermissions before app starts`, async () => {
      const device = await validDevice();
      await device.relaunchApp({permissions: {calendar: "YES"}});

      expect(driverMock.driver.setPermissions).toHaveBeenCalledWith(device._deviceId, device._bundleId, {calendar: "YES"});
    });

    it('with languageAndLocale should launch app with a specific language/locale', async () => {
      const expectedArgs = expectedDriverArgs;
      const device = validDevice();

      const languageAndLocale = {
        language: 'es-MX',
        locale: 'es-MX'
      };

      await device.launchApp({languageAndLocale});

      driverMock.expectLaunchCalled(device, expectedArgs, languageAndLocale);
    });

    it(`with disableTouchIndicators should send a boolean switch as a param in launchParams`, async () => {
      const expectedArgs = {...expectedDriverArgs, "-detoxDisableTouchIndicators": true};
      const device = await validDevice();

      await device.launchApp({disableTouchIndicators: true});

      driverMock.expectLaunchCalled(device, expectedArgs);
    });

    it(`with custom launchArgs should pass to native as launch args`, async () => {
      const launchArgs = {
        arg1: "1",
        arg2: 2,
      };
      const expectedArgs = {
        "-detoxServer": "ws://localhost:8099",
        "-detoxSessionId": "test",
        "-arg1": "1",
        "-arg2": 2,
      };

      const device = validDevice();

      await device.launchApp({launchArgs});

      driverMock.expectLaunchCalled(device, expectedArgs);
    });

    it(`with newInstance=false should check if process is in background and reopen it`, async () => {
      const processId = 1;
      const device = validDevice();

      device.deviceDriver.getBundleIdFromBinary.mockReturnValue('test.bundle');
      device.deviceDriver.launchApp.mockReturnValue(processId);

      await device.prepare({launchApp: true});
      await device.launchApp({newInstance: false});

      expect(driverMock.driver.deliverPayload).not.toHaveBeenCalled();
    });

    it(`with a url should check if process is in background and use openURL() instead of launch args`, async () => {
      const processId = 1;
      const device = validDevice();
      device.deviceDriver.getBundleIdFromBinary.mockReturnValue('test.bundle');
      device.deviceDriver.launchApp.mockReturnValue(processId);

      await device.prepare({launchApp: true});
      await device.launchApp({url: 'url://me'});

      expect(driverMock.driver.deliverPayload).toHaveBeenCalledTimes(1);
    });

    it(`with a url should check if process is in background and if not use launch args`, async () => {
      const launchParams = {url: 'url://me'};
      const processId = 1;
      const newProcessId = 2;

      const device = validDevice();
      device.deviceDriver.getBundleIdFromBinary.mockReturnValue('test.bundle');
      device.deviceDriver.launchApp.mockReturnValueOnce(processId).mockReturnValueOnce(newProcessId);

      await device.prepare();
      await device.launchApp(launchParams);

      expect(driverMock.driver.deliverPayload).not.toHaveBeenCalled();
    });

    it(`with a url should check if process is in background and use openURL() instead of launch args`, async () => {
      const launchParams = {url: 'url://me'};
      const processId = 1;

      const device = validDevice();
      device.deviceDriver.getBundleIdFromBinary.mockReturnValue('test.bundle');
      device.deviceDriver.launchApp.mockReturnValue(processId);

      await device.prepare({launchApp: true});
      await device.launchApp(launchParams);

      expect(driverMock.driver.deliverPayload).toHaveBeenCalledWith({delayPayload: true, url: 'url://me'});
    });

    it(`should keep user params unmodified`, async () => {
      const params = {
        url: 'some.url',
        launchArgs: {
          some: 'userArg',
        }
      };
      const paramsClone = _.cloneDeep(params);

      const device = validDevice();
      await device.launchApp(params);

      expect(params).toEqual(paramsClone);
    });

    it('with userActivity should check if process is in background and if it is use deliverPayload', async () => {
      const launchParams = {userActivity: 'userActivity'};
      const processId = 1;

      const device = validDevice();
      device.deviceDriver.getBundleIdFromBinary.mockReturnValue('test.bundle');
      device.deviceDriver.launchApp.mockReturnValueOnce(processId).mockReturnValueOnce(processId);
      device.deviceDriver.createPayloadFile = () => 'url';

      await device.prepare({launchApp: true});
      await device.launchApp(launchParams);

      expect(driverMock.driver.deliverPayload).toHaveBeenCalledWith({delayPayload: true, detoxUserActivityDataURL: 'url'});
    });


    it('with userNotification should check if process is in background and if it is use deliverPayload', async () => {
      const launchParams = {userNotification: 'notification'};
      const processId = 1;

      const device = validDevice();
      device.deviceDriver.getBundleIdFromBinary.mockReturnValue('test.bundle');
      device.deviceDriver.launchApp.mockReturnValueOnce(processId).mockReturnValueOnce(processId);
      device.deviceDriver.createPayloadFile = () => 'url';

      await device.prepare({launchApp: true});
      await device.launchApp(launchParams);

      expect(driverMock.driver.deliverPayload).toHaveBeenCalledTimes(1);
    });

    it(`with userNotification should check if process is in background and if not use launch args`, async () => {
      const launchParams = {userNotification: 'notification'};
      const processId = 1;
      const newProcessId = 2;

      const device = validDevice();
      device.deviceDriver.getBundleIdFromBinary.mockReturnValue('test.bundle');
      device.deviceDriver.launchApp.mockReturnValueOnce(processId).mockReturnValueOnce(newProcessId);

      await device.prepare();
      await device.launchApp(launchParams);

      expect(driverMock.driver.deliverPayload).not.toHaveBeenCalled();
    });

    it(`with userNotification and url should fail`, async () => {
      const launchParams = {userNotification: 'notification', url: 'url://me'};
      const processId = 1;
      driverMock.driver.getBundleIdFromBinary.mockReturnValue('test.bundle');
      driverMock.driver.launchApp.mockReturnValueOnce(processId).mockReturnValueOnce(processId);

      const device = validDevice();

      await device.prepare();

      try {
        await device.launchApp(launchParams);
        fail('should throw');
      } catch (ex) {
        expect(ex).toBeDefined();
      }

      expect(device.deviceDriver.deliverPayload).not.toHaveBeenCalled();
    });
  });

  describe('installApp()', () => {
    it(`with a custom app path should use custom app path`, async () => {
      const device = validDevice();

      await device.installApp('newAppPath');

      expect(driverMock.driver.installApp).toHaveBeenCalledWith(device._deviceId, 'newAppPath', undefined);
    });

    it(`with a custom test app path should use custom test app path`, async () => {
      const device = validDevice();

      await device.installApp('newAppPath', 'newTestAppPath');

      expect(driverMock.driver.installApp).toHaveBeenCalledWith(device._deviceId, 'newAppPath', 'newTestAppPath');
    });

    it(`with no args should use the default path given in configuration`, async () => {
      const device = validDevice();

      await device.installApp();

      expect(driverMock.driver.installApp).toHaveBeenCalledWith(device._deviceId, device._binaryPath, device._testBinaryPath);
    });
  });

  describe('uninstallApp()', () => {
    it(`with a custom app path should use custom app path`, async () => {
      const device = validDevice();

      await device.uninstallApp('newBundleId');

      expect(driverMock.driver.uninstallApp).toHaveBeenCalledWith(device._deviceId, 'newBundleId');
    });

    it(`with no args should use the default path given in configuration`, async () => {
      const device = validDevice();

      await device.uninstallApp();

      expect(driverMock.driver.uninstallApp).toHaveBeenCalledWith(device._deviceId, device._binaryPath);
    });
  });

  it(`sendToHome() should pass to device driver`, async () => {
    const device = validDevice();
    await device.sendToHome();

    expect(driverMock.driver.sendToHome).toHaveBeenCalledTimes(1);
  });

  it(`shake() should pass to device driver`, async () => {
    const device = validDevice();
    await device.shake();

    expect(driverMock.driver.shake).toHaveBeenCalledTimes(1);
  });

  it(`terminateApp() should pass to device driver`, async () => {
    const device = validDevice();
    await device.terminateApp();

    expect(driverMock.driver.terminate).toHaveBeenCalledTimes(1);
  });

  it(`shutdown() should pass to device driver`, async () => {
    const device = validDevice();
    await device.shutdown();

    expect(driverMock.driver.shutdown).toHaveBeenCalledTimes(1);
  });

  it(`openURL({url:url}) should pass to device driver`, async () => {
    const device = validDevice();
    await device.openURL({url: 'url'});

    expect(driverMock.driver.deliverPayload).toHaveBeenCalledWith({url: 'url'});
  });

  it(`openURL(notAnObject) should pass to device driver`, async () => {
    const device = validDevice();
    try {
      await device.openURL('url');
      fail('should throw');
    } catch (ex) {
      expect(ex).toBeDefined();
    }
  });

  it(`reloadReactNative() should pass to device driver`, async () => {
    const device = validDevice();
    await device.reloadReactNative();

    expect(driverMock.driver.reloadReactNative).toHaveBeenCalledTimes(1);
  });

  it(`setOrientation() should pass to device driver`, async () => {
    const device = validDevice();
    await device.setOrientation('param');

    expect(driverMock.driver.setOrientation).toHaveBeenCalledWith(device._deviceId, 'param');
  });

  it(`sendUserNotification() should pass to device driver`, async () => {
    const device = validDevice();
    await device.sendUserNotification('notif');

    expect(driverMock.driver.createPayloadFile).toHaveBeenCalledTimes(1);
    expect(driverMock.driver.deliverPayload).toHaveBeenCalledTimes(1);
  });

  it(`sendUserActivity() should pass to device driver`, async () => {
    const device = validDevice();
    await device.sendUserActivity('notif');

    expect(driverMock.driver.createPayloadFile).toHaveBeenCalledTimes(1);
    expect(driverMock.driver.deliverPayload).toHaveBeenCalledTimes(1);
  });

  it(`setLocation() should pass to device driver`, async () => {
    const device = validDevice();
    await device.setLocation(30.1, 30.2);

    expect(driverMock.driver.setLocation).toHaveBeenCalledWith(device._deviceId, '30.1', '30.2');
  });

  it(`setURLBlacklist() should pass to device driver`, async () => {
    const device = validDevice();
    await device.setURLBlacklist();

    expect(driverMock.driver.setURLBlacklist).toHaveBeenCalledTimes(1);
  });

  it(`enableSynchronization() should pass to device driver`, async () => {
    const device = validDevice();
    await device.enableSynchronization();

    expect(driverMock.driver.enableSynchronization).toHaveBeenCalledTimes(1);
  });

  it(`disableSynchronization() should pass to device driver`, async () => {
    const device = validDevice();
    await device.disableSynchronization();

    expect(driverMock.driver.disableSynchronization).toHaveBeenCalledTimes(1);
  });

  it(`resetContentAndSettings() should pass to device driver`, async () => {
    const device = validDevice();
    await device.resetContentAndSettings();

    expect(driverMock.driver.resetContentAndSettings).toHaveBeenCalledTimes(1);
  });

  it(`getPlatform() should pass to device driver`, async () => {
    const device = validDevice();
    device.getPlatform();

    expect(driverMock.driver.getPlatform).toHaveBeenCalledTimes(1);
  });

  it(`_cleanup() should pass to device driver`, async () => {
    const device = validDevice();
    await device._cleanup();

    expect(driverMock.driver.cleanup).toHaveBeenCalledTimes(1);
  });

  it(`new Device() with invalid device config (no binary) should throw`, () => {
    expect(() => new Device({
      deviceConfig: invalidDeviceNoBinary.configurations['ios.sim.release'],
      deviceDriver: new SimulatorDriver(client),
      sessionConfig: validScheme.session,
    })).toThrowErrorMatchingSnapshot();
  });

  it(`new Device() with invalid device config (no device name) should throw`, () => {
    expect(() => new Device({
      deviceConfig: invalidDeviceNoDeviceName.configurations['ios.sim.release'],
      deviceDriver: new SimulatorDriver(client),
      sessionConfig: validScheme.session,
    })).toThrowErrorMatchingSnapshot();
  });

  it(`should accept absolute path for binary`, async () => {
    const actualPath = await launchAndTestBinaryPath('absolutePath');
    expect(actualPath).toEqual(process.platform === 'win32' ? 'C:\\Temp\\abcdef\\123' : '/tmp/abcdef/123');
  });

  it(`should accept relative path for binary`, async () => {
    const actualPath = await launchAndTestBinaryPath('relativePath');
    expect(actualPath).toEqual(path.join(process.cwd(), 'abcdef/123'));
  });

  it(`pressBack() should invoke driver's pressBack()`, async () => {
    const device = validDevice();

    await device.pressBack();

    expect(driverMock.driver.pressBack).toHaveBeenCalledWith(device._deviceId);
  });

  it('takeScreenshot(name) should throw an exception if given name is empty', async () => {
    await expect(validDevice().takeScreenshot()).rejects.toThrowErrorMatchingSnapshot();
  });

  it('takeScreenshot(name) should delegate the work to the driver', async () => {
    device = validDevice();

    await device.takeScreenshot('name');
    expect(device.deviceDriver.takeScreenshot).toHaveBeenCalledWith('name');
  });

  async function launchAndTestBinaryPath(configuration) {
    const device = schemeDevice(configurationsMock.pathsTests, configuration);

    await device.prepare();
    await device.launchApp();

    return driverMock.driver.installApp.mock.calls[0][1];
  }
});
