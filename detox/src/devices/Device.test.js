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
});
