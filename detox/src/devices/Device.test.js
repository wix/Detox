const validScheme = require('../configurations.mock').validOneDeviceAndSession;

describe('Device', () => {
  let Client;
  let Device;
  let device;

  let argparse;

  beforeEach(() => {
    jest.mock('../utils/argparse');
    argparse = require('../utils/argparse');

    jest.mock('../client/Client');
    Client = require('../client/Client');
    Device = require('./Device');
    device = new Device(new Client(), validScheme);
  });

  it(`reloadReactNative() - should trigger reloadReactNative in websocket client`, () => {
    device.reloadReactNative();
    expect(device.client.reloadReactNative).toHaveBeenCalledTimes(1);
  });

  it(`sendUserNotification() - should trigger sendUserNotification in websocket client`, () => {
    const params = {some: "params"};
    device.sendUserNotification(params);
    expect(device.client.sendUserNotification).toHaveBeenCalledWith(params);
  });

  it(`relaunchApp() - should trigger waitUntilReady in websocket client`, () => {
    device.prepare();
    expect(device.client.waitUntilReady).toHaveBeenCalledTimes(1);
  });

  it(`relaunchApp() - should be defined`, async () => {
    expect(await device.relaunchApp()).toBeDefined();
  });

  it(`installApp() - should be defined`, async () => {
    expect(await device.installApp()).toBeDefined();
  });

  it(`uninstallApp() - should be defined`, async () => {
    expect(await device.uninstallApp()).toBeDefined();
  });

  it(`openURL() - should be defined`, async () => {
    expect(await device.openURL()).toBeDefined();
  });
});
