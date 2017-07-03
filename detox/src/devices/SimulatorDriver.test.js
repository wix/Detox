const _ = require('lodash');
const validScheme = require('../configurations.mock').validOneDeviceAndSession;

describe('SimulatorDriver', () => {
  let fs;
  let cpp;
  let SimulatorDriver;
  let simulatorDriver;
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

    SimulatorDriver = require('./SimulatorDriver');

    client = new Client(validScheme.session);
    await client.connect();
  });

  function validSimulator() {
    return new SimulatorDriver(client, validScheme.session, validScheme.configurations['ios.sim.release']);
  }

  it(`prepare() with wrong app path should throw`, async () => {
    simulatorDriver = validSimulator();
    fs.existsSync.mockReturnValueOnce(false);

    try {
      await simulatorDriver.prepare();
    } catch (ex) {
      expect(ex).toBeDefined();
    }
  });

  it(`prepare() with an app with no plist.info should throw`, async () => {
    simulatorDriver = validSimulator();
    fs.existsSync.mockReturnValueOnce(true);

    try {
      await simulatorDriver.prepare();
    } catch (ex) {
      expect(ex).toBeDefined();
    }
  });

  it(`acquireFreeDevice() should trigger fbsimctl.list`, async () => {
    simulatorDriver = validSimulator();
    await simulatorDriver.acquireFreeDevice();
    expect(simulatorDriver._fbsimctl.list).toHaveBeenCalledTimes(1);
  });


  it(`boot() should trigger fbsimctl.boot`, async () => {
    simulatorDriver = validSimulator();
    await simulatorDriver.boot();
    expect(simulatorDriver._fbsimctl.boot).toHaveBeenCalledTimes(1);
  });

  it(`installApp() should trigger fbsimctl.install`, async () => {
    simulatorDriver = validSimulator();
    await simulatorDriver.installApp();
    expect(simulatorDriver._fbsimctl.install).toHaveBeenCalledTimes(1);
  });

  it(`uninstallApp() should trigger fbsimctl.uninstall`, async () => {
    simulatorDriver = validSimulator();
    await simulatorDriver.uninstallApp('deviceId', 'bundleId');
    expect(simulatorDriver._fbsimctl.uninstall).toHaveBeenCalledWith('deviceId', 'bundleId');
  });

  it(`launch() should trigger fbsimctl.launch`, async () => {
    simulatorDriver = validSimulator();
    await simulatorDriver.launch('deviceId', 'bundleId', 'someArgs');
    expect(simulatorDriver._fbsimctl.launch).toHaveBeenCalledWith('deviceId', 'bundleId', 'someArgs');
  });

  it(`terminate() should trigger fbsimctl.terminate`, async () => {
    simulatorDriver = validSimulator();
    await simulatorDriver.terminate('deviceId', 'bundleId');
    expect(simulatorDriver._fbsimctl.terminate).toHaveBeenCalledWith('deviceId', 'bundleId');
  });

  it(`reloadReactNative() should trigger client.reloadReactNative`, async() => {
    simulatorDriver = validSimulator();
    await simulatorDriver.reloadReactNative();
    expect(simulatorDriver.client.reloadReactNative).toHaveBeenCalledTimes(1);
  });

  it(`sendUserNotification() should trigger client.sendUserNotification`, async() => {
    simulatorDriver = validSimulator();
    fs.existsSync.mockReturnValueOnce(false).mockReturnValueOnce(true);
    await simulatorDriver.sendUserNotification('notification');
    expect(simulatorDriver.client.sendUserNotification).toHaveBeenCalledTimes(1);
  });

  it(`shutdown() should trigger fbsimctl.shutdown`, async () => {
    simulatorDriver = validSimulator();
    fs.existsSync.mockReturnValue(true);
    await simulatorDriver.shutdown();
    expect(simulatorDriver._fbsimctl.shutdown).toHaveBeenCalledTimes(1);
  });

  it(`openURL() should trigger fbsimctl.open `, async() => {
    simulatorDriver = validSimulator();
    const url = 'url://poof';
    await simulatorDriver.openURL(simulatorDriver._deviceId, url);
    expect(simulatorDriver._fbsimctl.open).toHaveBeenCalledWith(simulatorDriver._deviceId, url);
  });

  it(`setOrientation() should throw an error if give wrong input `, async() => {
    expect.assertions(1);
    simulatorDriver = validSimulator();

    try {
      await simulatorDriver.setOrientation('UpsideDown');
    } catch(e) {
      expect(e.message).toMatch('setOrientation failed: provided orientation UpsideDown is not part of supported orientations: landscape,portrait');
    }
  });

  it(`setOrientation() should set the orientation to portrait`, async() => {
    simulatorDriver = validSimulator();

    await simulatorDriver.setOrientation('portrait');
    expect(client.execute).toHaveBeenCalled();
    const call = client.execute.mock.calls[client.execute.mock.calls.length - 1][0]();
    expect(call.target.type).toBe('EarlGrey');
    expect(call.method).toBe('rotateDeviceToOrientation:errorOrNil:');
    expect(call.args[0].value).toBe(1);
  });

  it(`setOrientation() should set the orientation to landscape`, async() => {
    simulatorDriver = validSimulator();

    await simulatorDriver.setOrientation('landscape');
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

    simulatorDriver = validSimulator();
    await simulatorDriver.setLocation(simulatorDriver._deviceId, coordinate.lat, coordinate.lon);
    expect(simulatorDriver._fbsimctl.setLocation).toHaveBeenCalledWith(simulatorDriver._deviceId, coordinate.lat, coordinate.lon);
  });

  it(`setURLBlacklist() should execute`, async() => {
    simulatorDriver = validSimulator();
    await simulatorDriver.setURLBlacklist(['.*127.0.0.1.*']);
    expect(simulatorDriver.client.execute).toHaveBeenCalledTimes(1);
  });

  it(`enableSynchronization() should execute`, async() => {
    simulatorDriver = validSimulator();
    await simulatorDriver.enableSynchronization();
    expect(simulatorDriver.client.execute).toHaveBeenCalledTimes(1);
  });

  it(`disableSynchronization() should execute`, async() => {
    simulatorDriver = validSimulator();
    await simulatorDriver.disableSynchronization();
    expect(simulatorDriver.client.execute).toHaveBeenCalledTimes(1);
  });

  it(`getBundleIdFromBinary() should return a valid bundleId`, async () => {
    simulatorDriver = validSimulator();
    cpp.exec.mockReturnValue(Promise.resolve({stdout: 'testBundleId'}));
    const bundleId = await simulatorDriver.getBundleIdFromBinary('binaryPath');
    expect(bundleId).toEqual('testBundleId');
  });

  it(`getBundleIdFromBinary() should throw if failed`, async () => {
    simulatorDriver = validSimulator();
    cpp.exec.mockReturnValue(Promise.reject({stderr: 'wat?'}));
    try {
      await simulatorDriver.getBundleIdFromBinary('binaryPath');
    } catch(ex) {
      expect(ex).toBeDefined();
    }
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
