const validScheme = require('../configurations.mock').validOneDeviceAndSession;

describe('DeviceDriverBase', () => {
  let fs;
  let Client;
  let DeviceDriverBase;
  let deviceDriver;

  let argparse;

  beforeEach(() => {
    jest.mock('fs');
    fs = require('fs');

    jest.mock('../utils/argparse');
    argparse = require('../utils/argparse');

    jest.mock('../client/Client');
    Client = require('../client/Client');
    DeviceDriverBase = require('./DeviceDriverBase');
    deviceDriver = new DeviceDriverBase(new Client(), validScheme);
  });

  it(`reloadReactNative() - should trigger reloadReactNative in websocket client`, () => {
    deviceDriver.reloadReactNative();
    expect(deviceDriver.client.reloadReactNative).toHaveBeenCalledTimes(1);
  });

  it(`sendUserNotification() - should trigger sendUserNotification in websocket client`, () => {
    const params = {some: "params"};
    deviceDriver.sendUserNotification(params);
    expect(deviceDriver.client.sendUserNotification).toHaveBeenCalledWith(params);
  });

  it(`acquireFreeDevice() - should be defined`, async() => {
    expect(await deviceDriver.acquireFreeDevice()).toBeDefined();
  });

  it(`boot() - should be defined`, async() => {
    expect(await deviceDriver.boot()).toBeDefined();
  });

  it(`launch() - should be defined`, async() => {
    expect(await deviceDriver.launch()).toBeDefined();
  });

  it(`terminate() - should be defined`, async() => {
    expect(await deviceDriver.terminate()).toBeDefined();
  });

  it(`relaunchApp() - should be defined`, async() => {
    expect(await deviceDriver.relaunchApp()).toBeDefined();
  });

  it(`installApp() - should be defined`, async() => {
    expect(await deviceDriver.installApp()).toBeDefined();
  });

  it(`uninstallApp() - should be defined`, async() => {
    expect(await deviceDriver.uninstallApp()).toBeDefined();
  });

  it(`openURL() - should be defined`, async() => {
    expect(await deviceDriver.openURL()).toBeDefined();
  });

  it(`shutdown() - should be defined`, async() => {
    expect(await deviceDriver.shutdown()).toBeDefined();
  });

  it(`setLocation() - should be defined`, async() => {
    expect(await deviceDriver.setLocation()).toBeDefined();
  });

  it(`setOrientation() - should be defined`, async() => {
    expect(await deviceDriver.setOrientation()).toBeDefined();
  });

  it(`setURLBlacklist() - should be defined`, async() => {
    expect(await deviceDriver.setURLBlacklist()).toBeDefined();
  });

  it(`waitUntilReady() -  should trigger waitUntilReady in websocket client`, async() => {
    await deviceDriver.waitUntilReady();
    expect(deviceDriver.client.waitUntilReady).toHaveBeenCalledTimes(1);
  });

  it(`enableSynchronization() - should be defined`, async() => {
    expect(await deviceDriver.enableSynchronization()).toBeDefined();
  });

  it(`disableSynchronization() - should be defined`, async() => {
    expect(await deviceDriver.disableSynchronization()).toBeDefined();
  });

  it(`defaultLaunchArgsPrefix() - should be defined`, async() => {
    expect(deviceDriver.defaultLaunchArgsPrefix()).toBeDefined();
  });

  it(`createPushNotificationJson() - should be defined`, async() => {
    deviceDriver.createPushNotificationJson();
    expect(deviceDriver.createPushNotificationJson).toBeDefined();
  });

  it(`getBundleIdFromBinary() - should be defined`, async() => {
    deviceDriver.getBundleIdFromBinary();
    expect(deviceDriver.getBundleIdFromBinary).toBeDefined();
  });
  it(`  setPermissions() - should be defined`, async() => {
    expect(await deviceDriver.setPermissions()).toBeDefined();
  });
});
