const _ = require('lodash');
const validScheme = require('../configurations.mock').validOneDeviceAndSession;

describe('simulator', () => {
  let fs;
  let ws;
  let cpp;
  let Simulator;
  let simulator;

  let Client;
  let client;

  beforeEach(() => {
    jest.mock('fs');
    fs = require('fs');

    jest.mock('child-process-promise');
    cpp = require('child-process-promise');

    jest.mock('./Fbsimctl');

    jest.mock('../client/client');
    Client = require('../client/client');

    Simulator = require('./simulator');

    client = new Client(validScheme.session);
    client.connect();
    simulator = new Simulator(client, validScheme.session, validScheme.configurations['ios.sim.release']);
  });

  it(`prepare() should boot a device`, async () => {
    simulator._getBundleIdFromApp = jest.fn();
    simulator._getAppAbsolutePath = jest.fn();

    await simulator.prepare();

    expect(simulator._fbsimctl.boot).toHaveBeenCalledTimes(1);
  });

  it(`prepare() with wrong app path should throw`, async () => {
    fs.existsSync.mockReturnValueOnce(false);

    try {
      await simulator.prepare();
    } catch (ex) {
      expect(ex).toBeDefined();
    }
  });

  it(`prepare() with an app with no plist.info should throw`, async () => {
    fs.existsSync.mockReturnValueOnce(true);

    try {
      await simulator.prepare();
    } catch (ex) {
      expect(ex).toBeDefined();
    }
  });

  it(`relaunchApp()`, async() => {
    await simulator.relaunchApp();

    expect(simulator._fbsimctl.terminate).toHaveBeenCalled();
    expect(simulator._fbsimctl.launch).toHaveBeenCalledWith(simulator._simulatorUdid,
      simulator._bundleId,
      ["-detoxServer", "ws://localhost:8099", "-detoxSessionId", "test"]);
  });

  it(`relaunchApp() with delete=true`, async() => {
    fs.existsSync.mockReturnValue(true);

    await simulator.relaunchApp({delete: true});

    expect(simulator._fbsimctl.uninstall).toHaveBeenCalled();
    expect(simulator._fbsimctl.install).toHaveBeenCalled();
    expect(simulator._fbsimctl.launch).toHaveBeenCalledWith(simulator._simulatorUdid,
      simulator._bundleId,
      ["-detoxServer", "ws://localhost:8099", "-detoxSessionId", "test"]);
  });

  it(`relaunchApp() with url should send the url as a param in launchParams`, async() => {
    await simulator.relaunchApp({url: `scheme://some.url`});

    expect(simulator._fbsimctl.launch).toHaveBeenCalledWith(simulator._simulatorUdid,
      simulator._bundleId,
      ["-detoxServer", "ws://localhost:8099", "-detoxSessionId", "test", "-detoxURLOverride", "scheme://some.url"]);
  });

  it(`relaunchApp() with userNofitication should send the userNotification as a param in launchParams`, async() => {
    fs.existsSync.mockReturnValue(true);
    simulator.createPushNotificationJson = jest.fn(() => 'url');

    await simulator.relaunchApp({userNotification: notification});

    expect(simulator._fbsimctl.launch).toHaveBeenCalledWith(simulator._simulatorUdid,
      simulator._bundleId,
      ["-detoxServer", "ws://localhost:8099", "-detoxSessionId", "test", "-detoxUserNotificationDataURL", "url"]);
  });

  it(`relaunchApp() with url and userNofitication should throw`, async() => {
    const done = jest.fn();
    try {
      await simulator.relaunchApp({url: "scheme://some.url", userNotification: notification}, done);
    } catch (ex) {
      expect(ex).toBeDefined();
    }
  });

  it(`installApp() should trigger fbsimctl.uinstall`, async () => {
    fs.existsSync.mockReturnValue(true);
    await simulator.installApp();
    expect(simulator._fbsimctl.install).toHaveBeenCalledTimes(1);
  });

  it(`uninstallApp() should trigger fbsimctl.uninstall`, async () => {
    fs.existsSync.mockReturnValue(true);
    await simulator.uninstallApp();
    expect(simulator._fbsimctl.uninstall).toHaveBeenCalledTimes(1);
  });

  it(`reloadReactNativeApp() should trigger client.reloadReactNative`, async() => {
    await simulator.reloadReactNative();
    expect(simulator.client.reloadReactNative).toHaveBeenCalledTimes(1);
  });

  it(`sendUserNotification() should trigger client.sendUserNotification`, async() => {
    fs.existsSync.mockReturnValueOnce(false).mockReturnValueOnce(true);
    await simulator.sendUserNotification('notification');
    expect(simulator.client.sendUserNotification).toHaveBeenCalledTimes(1);
  });

  it(`openURL() should trigger fbsimctl.open `, async() => {
    const url = 'url://poof';
    await simulator.openURL(url);
    expect(simulator._fbsimctl.open).toHaveBeenCalledWith(simulator._simulatorUdid, url);
  });
});

const notification = {
  "trigger": {
    "type": "timeInterval",
    "timeInterval": 30,
    "repeats": false
  },
  "title": "Title",
  "subtitle": "Subtitle",
  "body": "Body",
  "badge": 1,
  "payload": {
    "key1": "value1",
    "key2": "value2"
  },
  "category": "com.example.category",
  "user-text": "Hi there!",
  "content-available": 0,
  "action-identifier": "default2"
};
