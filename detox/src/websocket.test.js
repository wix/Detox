const _ = require('lodash');
const invoke = require('./invoke');
const config = require('./schemes.mock').valid.session;

describe('WebsocketClient', () => {
  let WebScoket;
  let WebsocketClient;
  let websocketClient;

  beforeEach(() => {
    jest.mock('npmlog');
    WebScoket = jest.mock('ws');
    WebsocketClient = require('./websocket');
  });

  it(`should connect to websocket server and receive connection message from testee`, () => {
    const done = jest.fn();
    connect(done);
    emitEvent('open');
    expectToSend(`{"type":"login","params":{"sessionId":"${config.sessionId}","role":"tester"}}`);
    expect(websocketClient.ws.send).toHaveBeenCalledTimes(1);

    // ready message does not emit any more messages
    emitEvent('message', `{"type":"ready","params":{}}`);
    expect(websocketClient.ws.send).toHaveBeenCalledTimes(1);
  });

  it(`handle malformed message, do nothing`, () => {
    const done = jest.fn();
    connect(done);
    //malformed message, expect to throw in done object
    emitEvent('message', `{"sillyParams":{"id":"0","result":""}}`);
  });

  it(`handle error message, log it`, () => {
    const done = jest.fn();
    connect(done);
    //malformed message, expect to throw in done object
    emitEvent('message', `{"type":"error","params":"this is an error"}`);
  });

  it(`handle testFailed message, throw error in done`, () => {
    const done = jest.fn();
    connect(done);

    //malformed message, expect to throw in done object
    emitEvent('message', `{"type":"testFailed","params": {"details": "this is an error"}}`);
    expect(done).toHaveBeenCalledWith(new Error('this is an error'));
  });

  it(`send one message, handle invokeResult message, expect empty queue`, () => {
    const done = jest.fn();
    connect(done);

    const call = invoke.call(invoke.IOS.Class('GREYMatchers'), 'matcherForAccessibilityLabel:', 'test');
    websocketClient.execute(call);

    emitEvent('message', `{"type":"invokeResult","params":{"id":"0","result":"(GREYElementInteraction)"}}`);
    expect(websocketClient.invokeQueue.length()).toBe(0);
  });

  it(`send two message, handle invokeResult message, expect queue with one item`, () => {
    const done = jest.fn();
    connect(done);

    const call = invoke.call(invoke.IOS.Class('GREYMatchers'), 'matcherForAccessibilityLabel:', 'test');
    websocketClient.execute(call);
    websocketClient.execute(call);

    emitEvent('message', `{"type":"invokeResult","params":{"id":"0","result":"(GREYElementInteraction)"}}`);
    expect(websocketClient.invokeQueue.length()).toBe(1);
  });

  it(`waitForTestResult() should save reference for 'done' when supplied`, () => {
    const done = jest.fn();
    connect(done);
    expect(websocketClient.onTestResult).toEqual(done);
  });

  it(`waitForTestResult() should throw if no 'done' is supplied`, () => {
    const done = jest.fn();
    connect(done);
    expect(websocketClient.waitForTestResult).toThrow();
  });

  it(`execute() should send an invocation json to testee, call is a function`, () => {
    const done = jest.fn();
    connect(done);

    const call = invoke.call(invoke.IOS.Class('GREYMatchers'), 'matcherForAccessibilityLabel:', 'test');
    websocketClient.execute(call);
    expectToSend(`{"type":"invoke","params":{"target":{"type":"Class","value":"GREYMatchers"},"method":"matcherForAccessibilityLabel:","args":["test"],"id":"0"}}`);
  });

  it(`execute() should send an invocation json to testee, call is a json`, () => {
    const done = jest.fn();
    connect(done);

    const call = invoke.call(invoke.IOS.Class('GREYMatchers'), 'matcherForAccessibilityLabel:', 'test');
    websocketClient.execute(call());
    expectToSend(`{"type":"invoke","params":{"target":{"type":"Class","value":"GREYMatchers"},"method":"matcherForAccessibilityLabel:","args":["test"],"id":"0"}}`);
  });

  it(`cleanup() should close websocket if open and send cleanup request`, () => {
    const done = jest.fn();
    connect(done);

    websocketClient.ws.readyState = 1;//WebScoket.OPEN;
    websocketClient.cleanup(done);
    expectToSend(`{"type":"cleanup"}`);

    emitEvent('message', `{"type":"cleanupDone","params":{}}`);
    expect(done).toHaveBeenCalled();
  });

  it(`cleanup() should just call 'done' if websocket is not open`, () => {
    const done = jest.fn();
    connect(done);

    websocketClient.ws.readyState = 3;//WebScoket.CLOSED;
    websocketClient.cleanup(done);
    expect(done).toHaveBeenCalled();
  });

  it(`close() should trigger ws.close() only if ws is defined`, () => {
    const done = jest.fn();
    connect(done);
    websocketClient.close();
    expect(websocketClient.ws.close).toHaveBeenCalled();
  });

  it(`close() should trigger ws.close() only if ws is defined`, () => {
    websocketClient = new WebsocketClient(config);
    websocketClient.close();
    expect(websocketClient.ws).toBeUndefined();
  });

  function connect(done) {
    websocketClient = new WebsocketClient(config);
    websocketClient.connect(done);
    websocketClient.waitForTestResult(done);
  }

  function emitEvent(eventName, params) {
    _.fromPairs(websocketClient.ws.on.mock.calls)[eventName](params);
  }

  function expectToSend(message) {
    expect(websocketClient.ws.send).toHaveBeenCalledWith(`${message}
 `);
  }
});
