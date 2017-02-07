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
    emitReady();
    expect(done).toHaveBeenCalled();
  });

  it(`prepare() -  `, async() => {
    const done = jest.fn();
    mockCppFailure(cpp);
    try {
      fs.existsSync.mockReturnValue(true);
      await simulator.prepare(done);
    } catch (ex) {
      console.log(ex)
      expect(ex).toBeDefined();
    }
  });

  it(`prepare() -  `, async() => {
    const done = jest.fn();
    mockCppFailure(cpp);
    try {
      await simulator.prepare(done);
    } catch (ex) {
      console.log(ex)
      expect(ex).toBeDefined();
    }
  });

  it(`relaunchApp() -  `, async() => {
    const done = jest.fn();
    await simulator.relaunchApp(done);
    emitReady();
    expect(done).toHaveBeenCalled();
  });

  it(`deleteAndRelaunchApp() -  `, async() => {
    const done = jest.fn();
    fs.existsSync.mockReturnValue(true);
    await simulator.deleteAndRelaunchApp(done);
    emitReady();
    expect(done).toHaveBeenCalled();
  });

  it(`reloadReactNativeApp() -  `, async() => {
    const done = jest.fn();
    await simulator.reloadReactNativeApp(done);
    emitReady();
    expect(done).toHaveBeenCalled();
  });

  it(`openURL() -  `, async() => {
    await simulator.openURL('url://poof');
  });

  function emitEvent(eventName, params) {
    _.fromPairs(websocketClient.ws.on.mock.calls)[eventName](params);
  }

  function emitReady() {
    emitEvent('message', `{"type":"ready","params":{}}`);
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
