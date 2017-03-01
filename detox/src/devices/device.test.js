const validScheme = require('../schemes.mock').valid;
const noScheme = require('../schemes.mock').noScheme;
const noAppPathScheme = require('../schemes.mock').noAppPath;
const noDeviceScheme = require('../schemes.mock').noDevice;

describe('device', () => {
  let Client;
  let Device;
  let device;

  let argparse;

  beforeEach(() => {
    jest.mock('../utils/argparse');
    argparse = require('../utils/argparse');

    jest.mock('../client/client');
    Client = require('../client/client');
    Device = require('./device');
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

  it(`_detrmineCurrentScheme() - should resolve a scheme if its valid`, () => {
    const resolvedScheme = device._detrmineCurrentScheme(validScheme);
    expect(resolvedScheme).toBeDefined();
  });

  it(`_detrmineCurrentScheme() - should use custom scheme if suppled in command line args`, () => {
    argparse.getArgValue.mockReturnValue('ios-simulator');
    const resolvedScheme = device._detrmineCurrentScheme(validScheme);
    expect(resolvedScheme).toBeDefined();
  });

  it(`_detrmineCurrentScheme() - should throw error when a nonexistent custom scheme is suppled in command line args`, () => {
    argparse.getArgValue.mockReturnValue('nonexistent');
    try {
      device._detrmineCurrentScheme(noScheme);
    } catch (ex) {
      expect(ex).toBeDefined();
    }
  });

  it(`_detrmineCurrentScheme() - should throw error when has no 'scheme'`, () => {
    try {
      device._detrmineCurrentScheme(noScheme);
    } catch (ex) {
      expect(ex).toBeDefined();
    }
  });

  it(`_detrmineCurrentScheme() - should throw error when has no 'scheme.app'`, () => {
    try {
      device._detrmineCurrentScheme(noAppPathScheme);
    } catch (ex) {
      expect(ex).toBeDefined();
    }
  });

  it(`_detrmineCurrentScheme() - should throw error when has no 'scheme.device'`, () => {
    try {
      device._detrmineCurrentScheme(noDeviceScheme);
    } catch (ex) {
      expect(ex).toBeDefined();
    }
  });
});
