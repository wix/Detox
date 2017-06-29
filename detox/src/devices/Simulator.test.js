const _ = require('lodash');
const validScheme = require('../configurations.mock').validOneDeviceAndSession;
const invalidDeviceNoBinary = require('../configurations.mock').invalidDeviceNoBinary;
const invalidDeviceNoDeviceName = require('../configurations.mock').invalidDeviceNoDeviceName;

describe('Simulator', () => {
  let fs;
  let ws;
  let cpp;
  let Simulator;
  let simulator;
  let argparse;

  let Client;
  let client;

  beforeEach(async () => {
    jest.mock('fs');
    fs = require('fs');
    jest.mock('../ios/expect');
    jest.mock('child-process-promise');
    cpp = require('child-process-promise');

    jest.mock('./Fbsimctl');

    jest.mock('../client/Client');
    jest.mock('../utils/argparse');
    argparse = require('../utils/argparse');

    Client = require('../client/Client');

    Simulator = require('./Simulator');

    client = new Client(validScheme.session);
    await client.connect();
  });

  function validSimulator() {
    return new Simulator(client, validScheme.session, validScheme.configurations['ios.sim.release']);
  }

  it(`prepare() should boot a device`, async () => {
    simulator = validSimulator();
    simulator._getBundleIdFromApp = jest.fn();
    simulator._getAppAbsolutePath = jest.fn();

    await simulator.prepare();

    expect(simulator._fbsimctl.boot).toHaveBeenCalledTimes(1);
  });

  it(`prepare() with wrong app path should throw`, async () => {
    simulator = validSimulator();
    fs.existsSync.mockReturnValueOnce(false);

    try {
      await simulator.prepare();
    } catch (ex) {
      expect(ex).toBeDefined();
    }
  });

  it(`prepare() with an app with no plist.info should throw`, async () => {
    simulator = validSimulator();
    fs.existsSync.mockReturnValueOnce(true);

    try {
      await simulator.prepare();
    } catch (ex) {
      expect(ex).toBeDefined();
    }
  });

  it('init Simulator with invalid binaryPath should throw', async () => {
    expect(() => new Simulator(client, invalidDeviceNoBinary.session, invalidDeviceNoBinary.configurations['ios.sim.release'])).toThrow();
  });

  it('init Simulator with invalid binaryPath should throw', async () => {
    expect(() => new Simulator(client, invalidDeviceNoDeviceName.session, invalidDeviceNoDeviceName.configurations['ios.sim.release'])).toThrow();
  });

  it(`relaunchApp()`, async() => {
    simulator = validSimulator();
    await simulator.relaunchApp();

    expect(simulator._fbsimctl.terminate).toHaveBeenCalled();
    expect(simulator._fbsimctl.launch).toHaveBeenCalledWith(simulator._simulatorUdid,
      simulator._bundleId,
      ["-detoxServer", "ws://localhost:8099", "-detoxSessionId", "test"]);
  });

  it(`relaunchApp() with delete=true`, async() => {
    simulator = validSimulator();
    fs.existsSync.mockReturnValue(true);

    await simulator.relaunchApp({delete: true});

    expect(simulator._fbsimctl.uninstall).toHaveBeenCalled();
    expect(simulator._fbsimctl.install).toHaveBeenCalled();
    expect(simulator._fbsimctl.launch).toHaveBeenCalledWith(simulator._simulatorUdid,
      simulator._bundleId,
      ["-detoxServer", "ws://localhost:8099", "-detoxSessionId", "test"]);
  });


  it(`relaunchApp() without delete when reuse is enabled should not uninstall and install`, async() => {
    simulator = validSimulator();
    argparse.getArgValue.mockReturnValue(true);
    fs.existsSync.mockReturnValue(true);

    await simulator.relaunchApp();

    expect(simulator._fbsimctl.uninstall).not.toHaveBeenCalled();
    expect(simulator._fbsimctl.install).not.toHaveBeenCalled();
    expect(simulator._fbsimctl.launch).toHaveBeenCalledWith(simulator._simulatorUdid,
      simulator._bundleId,
      ["-detoxServer", "ws://localhost:8099", "-detoxSessionId", "test"]);
  });

  it(`relaunchApp() with url should send the url as a param in launchParams`, async() => {
    simulator = validSimulator();
    await simulator.relaunchApp({url: `scheme://some.url`});

    expect(simulator._fbsimctl.launch).toHaveBeenCalledWith(simulator._simulatorUdid,
      simulator._bundleId,
      ["-detoxServer", "ws://localhost:8099", "-detoxSessionId", "test", "-detoxURLOverride", "scheme://some.url"]);
  });

  it(`relaunchApp() with userNofitication should send the userNotification as a param in launchParams`, async() => {
    simulator = validSimulator();
    fs.existsSync.mockReturnValue(true);
    simulator.createPushNotificationJson = jest.fn(() => 'url');

    await simulator.relaunchApp({userNotification: notification});

    expect(simulator._fbsimctl.launch).toHaveBeenCalledWith(simulator._simulatorUdid,
      simulator._bundleId,
      ["-detoxServer", "ws://localhost:8099", "-detoxSessionId", "test", "-detoxUserNotificationDataURL", "url"]);
  });

  it(`relaunchApp() with url and userNofitication should throw`, async() => {
    simulator = validSimulator();
    try {
      await simulator.relaunchApp({url: "scheme://some.url", userNotification: notification});
    } catch (ex) {
      expect(ex).toBeDefined();
    }
  });

  it(`installApp() should trigger fbsimctl.uinstall`, async () => {
    simulator = validSimulator();
    fs.existsSync.mockReturnValue(true);
    await simulator.installApp();
    expect(simulator._fbsimctl.install).toHaveBeenCalledTimes(1);
  });

  it(`uninstallApp() should trigger fbsimctl.uninstall`, async () => {
    simulator = validSimulator();
    fs.existsSync.mockReturnValue(true);
    await simulator.uninstallApp();
    expect(simulator._fbsimctl.uninstall).toHaveBeenCalledTimes(1);
  });

  it(`reloadReactNative() should trigger client.reloadReactNative`, async() => {
    simulator = validSimulator();
    await simulator.reloadReactNative();
    expect(simulator.client.reloadReactNative).toHaveBeenCalledTimes(1);
  });

  it(`sendUserNotification() should trigger client.sendUserNotification`, async() => {
    simulator = validSimulator();
    fs.existsSync.mockReturnValueOnce(false).mockReturnValueOnce(true);
    await simulator.sendUserNotification('notification');
    expect(simulator.client.sendUserNotification).toHaveBeenCalledTimes(1);
  });

  it(`shutdown() should trigger fbsimctl.shutdown`, async () => {
    simulator = validSimulator();
    fs.existsSync.mockReturnValue(true);
    await simulator.shutdown();
    expect(simulator._fbsimctl.shutdown).toHaveBeenCalledTimes(1);
  });

  it(`openURL() should trigger fbsimctl.open `, async() => {
    simulator = validSimulator();
    const url = 'url://poof';
    await simulator.openURL(url);
    expect(simulator._fbsimctl.open).toHaveBeenCalledWith(simulator._simulatorUdid, url);
  });

  it(`setOrientation() should throw an error if give wrong input `, async() => {
    expect.assertions(1);
    simulator = validSimulator();

    try {
      await simulator.setOrientation('UpsideDown');
    } catch(e) {
      expect(e.message).toMatch('setOrientation failed: provided orientation UpsideDown is not part of supported orientations: landscape,portrait');
    }
  });

  it(`setOrientation() should set the orientation to portrait`, async() => {
    simulator = validSimulator();

    await simulator.setOrientation('portrait');
    expect(client.execute).toHaveBeenCalled();
    const call = client.execute.mock.calls[client.execute.mock.calls.length - 1][0]();
    expect(call.target.type).toBe('EarlGrey');
    expect(call.method).toBe('rotateDeviceToOrientation:errorOrNil:');
    expect(call.args[0].value).toBe(1);
  });

  it(`setOrientation() should set the orientation to landscape`, async() => {
    simulator = validSimulator();

    await simulator.setOrientation('landscape');
    expect(client.execute).toHaveBeenCalled();
    const call = client.execute.mock.calls[client.execute.mock.calls.length - 1][0]();
    expect(call.target.type).toBe('EarlGrey');
    expect(call.method).toBe('rotateDeviceToOrientation:errorOrNil:');
    expect(call.args[0].value).toBe(3);
  });

  it(`setLocation() should trigger fbsimctl.setLocation`, async () => {
    const coordinate = {
      lat: 30.000,
      lon: 40.000
    };

    simulator = validSimulator();
    await simulator.setLocation(coordinate.lat, coordinate.lon);
    expect(simulator._fbsimctl.setLocation).toHaveBeenCalledWith(simulator._simulatorUdid, coordinate.lat, coordinate.lon);
  });

  it(`setURLBlacklist() should execute`, async() => {
    simulator = validSimulator();
    await simulator.setURLBlacklist(['.*127.0.0.1.*']);
    expect(simulator.client.execute).toHaveBeenCalledTimes(1);
  });

  it(`enableSynchronization() should execute`, async() => {
    simulator = validSimulator();
    await simulator.enableSynchronization();
    expect(simulator.client.execute).toHaveBeenCalledTimes(1);
  });

  it(`disableSynchronization() should execute`, async() => {
    simulator = validSimulator();
    await simulator.disableSynchronization();
    expect(simulator.client.execute).toHaveBeenCalledTimes(1);
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
