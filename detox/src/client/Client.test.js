const config = require('../configurations.mock').validOneDeviceAndSession.session;
const invoke = require('../invoke');

describe('Client', () => {
  let WebSocket;
  let Client;
  let client;

  beforeEach(() => {
    jest.mock('npmlog');
    WebSocket = jest.mock('./AsyncWebSocket');
    Client = require('./Client');
  });

  it(`reloadReactNative() - should receive ready from device and resolve`, async () => {
    await connect();
    client.ws.send.mockReturnValueOnce(Promise.resolve(`{"type":"ready","params": {}}`));
    await client.reloadReactNative();
  });

  it(`reloadReactNative() - should throw if receives wrong response from device`, async () => {
    await connect();
    client.ws.send.mockReturnValueOnce(Promise.resolve(`{"type":"somethingElse","params": {}}`));
    try {
      await client.reloadReactNative();
    } catch (ex) {
      expect(ex).toBeDefined();
    }
  });

  it(`sendUserNotification() - should receive ready from device and resolve`, async () => {
    await connect();
    client.ws.send.mockReturnValueOnce(Promise.resolve(`{"type":"userNotificationDone","params": {}}`));
    await client.sendUserNotification();

    expect(client.ws.send).toHaveBeenCalledTimes(2);
  });

  it(`waitUntilReady() - should receive ready from device and resolve`, async () => {
    await connect();
    client.ws.send.mockReturnValueOnce(Promise.resolve(`{"type":"ready","params": {}}`));
    await client.waitUntilReady();

    expect(client.ws.send).toHaveBeenCalledTimes(2);
  });

  it(`cleanup() - if connected should send cleanup action and close websocket`, async () => {
    await connect();
    client.ws.send.mockReturnValueOnce(Promise.resolve(`{"type":"cleanupDone","params": {}}`));
    await client.cleanup();

    expect(client.ws.send).toHaveBeenCalledTimes(2);
  });

  it(`cleanup() - if not connected should do nothing`, async () => {
    client = new Client(config);
    client.ws.send.mockReturnValueOnce(Promise.resolve(`{"type":"cleanupDone","params": {}}`));
    await client.cleanup();

    expect(client.ws.send).not.toHaveBeenCalled();
  });

  it(`execute() - "invokeResult" on an invocation object should resolve`, async () => {
    await connect();
    client.ws.send.mockReturnValueOnce(Promise.resolve(`{"type":"invokeResult","params":{"id":"0","result":"(GREYElementInteraction)"}}`));

    const call = invoke.call(invoke.IOS.Class('GREYMatchers'), 'matcherForAccessibilityLabel:', 'test');
    await client.execute(call());

    expect(client.ws.send).toHaveBeenCalledTimes(2);
  });

  it(`execute() - "invokeResult" on an invocation function should resolve`, async () => {
    await connect();
    client.ws.send.mockReturnValueOnce(Promise.resolve(`{"type":"invokeResult","params":{"id":"0","result":"(GREYElementInteraction)"}}`));

    const call = invoke.call(invoke.IOS.Class('GREYMatchers'), 'matcherForAccessibilityLabel:', 'test');
    await client.execute(call);

    expect(client.ws.send).toHaveBeenCalledTimes(2);
  });

  it(`execute() - "testFailed" result should throw`, async () => {
    await connect();
    client.ws.send.mockReturnValueOnce(Promise.resolve(`{"type":"testFailed","params": {"details": "this is an error"}}`));
    const call = invoke.call(invoke.IOS.Class('GREYMatchers'), 'matcherForAccessibilityLabel:', 'test');
    try {
      await client.execute(call);
    } catch (ex) {
      expect(ex).toBeDefined();
    }
  });

  it(`execute() - "error" result should throw`, async () => {
    await connect();
    client.ws.send.mockReturnValueOnce(Promise.resolve(`{"type":"error","params": {"details": "this is an error"}}`));
    const call = invoke.call(invoke.IOS.Class('GREYMatchers'), 'matcherForAccessibilityLabel:', 'test');
    try {
      await client.execute(call);
    } catch (ex) {
      expect(ex).toBeDefined();
    }
  });

  it(`execute() - unsupported result should throw`, async () => {
    await connect();
    client.ws.send.mockReturnValueOnce(Promise.resolve(`{"unsupported":"unsupported"}`));
    const call = invoke.call(invoke.IOS.Class('GREYMatchers'), 'matcherForAccessibilityLabel:', 'test');
    try {
      await client.execute(call);
    } catch (ex) {
      expect(ex).toBeDefined();
    }
  });

  async function connect() {
    client = new Client(config);
    client.ws.send.mockReturnValueOnce(Promise.resolve(`{"type":"ready","params": {}}`));
    await client.connect();
    client.ws.isOpen.mockReturnValue(true);
  }
});
