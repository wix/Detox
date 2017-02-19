const _ = require('lodash');
const validScheme = require('../schemes.mock').valid;

describe('simulator', () => {
  let fs;
  let ws;
  let cpp;
  let Simulator;
  let simulator;

  let WebsocketClient;
  let websocketClient;

  let argparse;

  beforeEach(() => {
    jest.mock('npmlog');

    jest.mock('fs');
    fs = require('fs');

    jest.mock('child-process-promise');
    cpp = require('child-process-promise');

    jest.mock('./Fbsimctl');

    jest.mock('ws');
    WebsocketClient = require('../websocket');

    jest.mock('../utils/argparse');
    argparse = require('../utils/argparse');

    Simulator = require('./simulator');

    websocketClient = new WebsocketClient(validScheme.session);
    websocketClient.connect(jest.fn());
    simulator = new Simulator(websocketClient, validScheme);
  });

  it(`prepare() - expect to finish preperation and call 'done' callback`, async() => {
    const done = jest.fn();
    mockCppSuccessful(cpp);
    fs.existsSync.mockReturnValue(true);
    await simulator.prepare(done);
    fakeDeviceReady();
    expect(done).toHaveBeenCalled();
  });

  it(`prepare() -  `, async() => {
    const done = jest.fn();
    mockCppFailure(cpp);
    try {
      fs.existsSync.mockReturnValue(true);
      await simulator.prepare(done);
    } catch (ex) {
      expect(ex).toBeDefined();
    }
  });

  it(`prepare() -  `, async() => {
    const done = jest.fn();
    mockCppFailure(cpp);
    try {
      await simulator.prepare(done);
    } catch (ex) {
      expect(ex).toBeDefined();
    }
  });

  it(`relaunchApp()`, async() => {
    const done = jest.fn();
    await simulator.relaunchApp(done);
    fakeDeviceReady();
    expect(done).toHaveBeenCalled();
  });

  it(`relaunchApp() with delete=true`, async() => {
    const done = jest.fn();
    fs.existsSync.mockReturnValue(true);

    await simulator.relaunchApp({delete: true}, done);
    fakeDeviceReady();

    expect(done).toHaveBeenCalled();
    expect(simulator._fbsimctl.uninstall).toHaveBeenCalled();
    expect(simulator._fbsimctl.install).toHaveBeenCalled();
  });

  it(`relaunchApp() with url hould send the url as a param in launchParams`, async() => {
    const done = jest.fn();
    await simulator.relaunchApp({url: `scheme://some.url`}, done);
    fakeDeviceReady();
    expect(done).toHaveBeenCalled();
  });

  it(`relaunchApp() with userNofitication should send the userNotification as a param in launchParams`, async() => {
    const done = jest.fn();
    fs.existsSync.mockReturnValue(true);
    await simulator.relaunchApp({userNotification: notification}, done);
    fakeDeviceReady();
    expect(done).toHaveBeenCalled();
  });

  it(`relaunchApp() with url and userNofitication should throw`, async() => {
    const done = jest.fn();
    try {
      await simulator.relaunchApp({url: "scheme://some.url", userNotification: notification}, done);
    } catch (ex) {
      expect(ex).toBeDefined();
    }
  });

  it(`installApp() should call done when passed as param`, async () => {
    const done = jest.fn();
    fs.existsSync.mockReturnValue(true);
    await simulator.installApp(done);
    expect(done).toHaveBeenCalled();
  });

  it(`installApp() should support async await`, async() => {
    const done = jest.fn();
    fs.existsSync.mockReturnValue(true);
    await simulator.installApp();
    expect(done).not.toHaveBeenCalled();
  });

  it(`uninstallApp() should call done when passed as param`, async () => {
    const done = jest.fn();
    fs.existsSync.mockReturnValue(true);
    await simulator.uninstallApp(done);
    expect(done).toHaveBeenCalled();
  });

  it(`uninstallApp() should support async await`, async() => {
    const done = jest.fn();
    fs.existsSync.mockReturnValue(true);
    await simulator.uninstallApp();
    expect(done).not.toHaveBeenCalled();
  });


  it(`deleteAndRelaunchApp() -  `, async() => {
    const done = jest.fn();
    fs.existsSync.mockReturnValue(true);
    await simulator.deleteAndRelaunchApp(done);
    fakeDeviceReady();
    expect(done).toHaveBeenCalled();
  });

  it(`reloadReactNativeApp() -  `, async() => {
    const done = jest.fn();
    await simulator.reloadReactNativeApp(done);
    fakeDeviceReady();
    expect(done).toHaveBeenCalled();
  });

  it(`sendUserNotification() -  `, async() => {
    const done = jest.fn();
    fs.existsSync.mockReturnValueOnce(false).mockReturnValueOnce(true);
    await simulator.sendUserNotification({}, done);
    fakeDeviceMessage('userNotificationDone', {});
    expect(done).toHaveBeenCalled();
  });

  it(`openURL() -  `, async() => {
    await simulator.openURL('url://poof');
  });

  function fakeWebsocketCallback(eventName, params) {
    _.fromPairs(websocketClient.ws.on.mock.calls)[eventName](params);
  }

  function fakeDeviceMessage(type, params) {
    fakeWebsocketCallback('message', `{"type":"${type}","params":${JSON.stringify(params)}}`);
  }

  function fakeDeviceReady() {
    fakeDeviceMessage('ready', {});
  }
});

function returnSuccessfulWithValue(value) {
  const result = {
    stdout: JSON.stringify(value),
    stderr: "err",
    childProcess: {
      exitCode: 0
    }
  };
  return result;
}

function mockCppSuccessful(cpp) {
  const successfulResult = returnSuccessfulWithValue('successful result');
  const resolvedPromise = Promise.resolve(successfulResult);
  cpp.exec.mockReturnValueOnce(resolvedPromise);

  return successfulResult;
}

function mockCppFailure(cpp) {
  const failureResult = returnSuccessfulWithValue('successful result');
  const rejectedPromise = Promise.reject(failureResult);
  cpp.exec.mockReturnValueOnce(rejectedPromise);

  return failureResult;
}

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
