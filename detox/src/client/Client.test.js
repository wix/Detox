const config = require('../configurations.mock').validOneDeviceAndSession.session;
const invoke = require('../invoke');

describe('Client', () => {
  let argparse;
  let WebSocket;
  let Client;
  let client;

  beforeEach(() => {
    jest.mock('npmlog');
    WebSocket = jest.mock('./AsyncWebSocket');
    Client = require('./Client');

    jest.mock('../utils/argparse');
    argparse = require('../utils/argparse');
  });

  it(`reloadReactNative() - should receive ready from device and resolve`, async () => {
    await connect();
    client.ws.send.mockReturnValueOnce(response("ready", {}, 1));
    await client.reloadReactNative();
  });

  it(`reloadReactNative() - should throw if receives wrong response from device`, async () => {
    await connect();
    client.ws.send.mockReturnValueOnce(response("somethingElse", {}, 1));
    try {
      await client.reloadReactNative();

    } catch (ex) {
      expect(ex).toBeDefined();
    }
  });

  it(`sendUserNotification() - should receive ready from device and resolve`, async () => {
    await connect();
    client.ws.send.mockReturnValueOnce(response("userNotificationDone", {}, 1));
    await client.sendUserNotification();

    expect(client.ws.send).toHaveBeenCalledTimes(2);
  });

  it(`waitUntilReady() - should receive ready from device and resolve`, async () => {
    await connect();
    client.ws.send.mockReturnValueOnce(response("ready", {}, 1));
    await client.waitUntilReady();

    expect(client.ws.send).toHaveBeenCalledTimes(2);
  });

  it(`cleanup() - if connected should send cleanup action and close websocket`, async () => {
    await connect();
    client.ws.send.mockReturnValueOnce(response("cleanupDone", {}, 1));
    await client.cleanup();

    expect(client.ws.send).toHaveBeenCalledTimes(2);
  });

  it(`cleanup() - if not connected should do nothing`, async () => {
    client = new Client(config);
    client.ws.send.mockReturnValueOnce(response("cleanupDone", {}, 1));
    await client.cleanup();

    expect(client.ws.send).not.toHaveBeenCalled();
  });

  it(`execute() - "invokeResult" on an invocation object should resolve`, async () => {
    await connect();
    client.ws.send.mockReturnValueOnce(response("invokeResult", {result:"(GREYElementInteraction)"}, 1));

    const call = invoke.call(invoke.IOS.Class('GREYMatchers'), 'matcherForAccessibilityLabel:', 'test');
    await client.execute(call());

    expect(client.ws.send).toHaveBeenCalledTimes(2);
  });

  async function executeWithSlowInvocation(invocationTime) {
    argparse.getArgValue.mockReturnValue(2); // set debug-slow-invocations

    await connect();

    client.ws.send.mockReturnValueOnce(timeout(invocationTime).then(()=> response("invokeResult", {result:"(GREYElementInteraction)"}, 1)))
                  .mockReturnValueOnce(response("currentStatusResult", {}, 2));

    const call = invoke.call(invoke.IOS.Class('GREYMatchers'), 'matcherForAccessibilityLabel:', 'test');
    await client.execute(call);
  }

  it(`execute() - fast invocation should not trigger "slowInvocationStatus"`, async () => {
    await executeWithSlowInvocation(1);
    expect(client.ws.send).toHaveBeenLastCalledWith({"params": {"args": ["test"], "method": "matcherForAccessibilityLabel:", "target": {"type": "Class", "value": "GREYMatchers"}}, "type": "invoke"}, undefined);
  });

  it(`execute() - slow invocation should trigger "slowInvocationStatus:`, async () => {
    await executeWithSlowInvocation(4);
    expect(client.ws.send).toHaveBeenLastCalledWith({"params": {}, "type": "currentStatus"}, undefined);
  });

  it(`execute() - "invokeResult" on an invocation function should resolve`, async () => {
    await connect();
    client.ws.send.mockReturnValueOnce(response("invokeResult", {result:"(GREYElementInteraction)"} ,1));

    const call = invoke.call(invoke.IOS.Class('GREYMatchers'), 'matcherForAccessibilityLabel:', 'test');
    await client.execute(call);

    expect(client.ws.send).toHaveBeenCalledTimes(2);
  });

  it(`execute() - "testFailed" result should throw`, async () => {
    await connect();
    client.ws.send.mockReturnValueOnce(response("testFailed",  {details: "this is an error"}, 1));
    const call = invoke.call(invoke.IOS.Class('GREYMatchers'), 'matcherForAccessibilityLabel:', 'test');
    try {
      await client.execute(call);
    } catch (ex) {
      expect(ex).toBeDefined();
    }
  });

  it(`execute() - "error" result should throw`, async () => {
    await connect();
    client.ws.send.mockReturnValueOnce(response("error", {details: "this is an error"}), 1);
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
    client.ws.send.mockReturnValueOnce(response("ready", {}, 1));
    await client.connect();
    client.ws.isOpen.mockReturnValue(true);
  }

  function response(type, params, messageId) {
    return Promise.resolve(
      JSON.stringify({
      type: type,
      params: params,
      messageId: messageId
    })
  )}

  async function timeout(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

});
