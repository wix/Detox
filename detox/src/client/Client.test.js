const tempfile = require('tempfile');
const actions = require('./actions/actions');
const config = require('../configurations.mock').validOneDeviceAndSession.session;
const invoke = require('../invoke');

describe('Client', () => {
  let argparse;
  let WebSocket;
  let Client;
  let client;
  let log;

  beforeEach(() => {
    jest.mock('../utils/logger');
    WebSocket = jest.mock('./AsyncWebSocket');

    jest.mock('../utils/argparse');
    argparse = require('../utils/argparse');

    Client = require('./Client');
    log = require('../utils/logger');
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

  it(`deliverPayload() - should send an 'deliverPayload' action and resolve when 'deliverPayloadDone' returns`, async () => {
    await connect();
    client.ws.send.mockReturnValueOnce(response("deliverPayloadDone", {}, 1));
    await client.deliverPayload({url: 'url'});

    expect(client.ws.send).toHaveBeenCalledTimes(2);
  });

  it(`shake() - should send a 'shake' action and resolve when 'shakeDeviceDone' returns`, async () => {
    await connect();
    client.ws.send.mockReturnValueOnce(response("shakeDeviceDone", {}, 1));
    await client.shake();

    expect(client.ws.send).toHaveBeenCalledTimes(2);
  });

  it(`startInstrumentsRecording() - should send a 'setRecordingState' action and resolve when 'setRecordingStateDone' returns`, async () => {
    await connect();
    client.ws.send.mockReturnValueOnce(response("setRecordingStateDone", {}, 1));

    const recordingPath = tempfile('.dtxrec');
    await client.startInstrumentsRecording({ recordingPath });

    expect(client.ws.send).toHaveBeenCalledWith(expect.objectContaining({
      type: 'setRecordingState',
      params: expect.objectContaining({ recordingPath }),
    }), undefined);
  });

  it(`stopInstrumentsRecording() - should send an empty 'setRecordingState' action and resolve when 'setRecordingStateDone' returns`, async () => {
    await connect();
    client.ws.send.mockReturnValueOnce(response("setRecordingStateDone", {}, 1));

    await client.stopInstrumentsRecording();

    expect(client.ws.send).toHaveBeenCalledWith(expect.objectContaining({
      type: 'setRecordingState',
      params: {}
    }), undefined);
  });

  it(`waitUntilReady() - should receive ready from device and resolve`, async () => {
    await connect();
    client.ws.send.mockReturnValueOnce(response("ready", {}, 1));
    await client.waitUntilReady();

    expect(client.ws.send).toHaveBeenCalledTimes(2);
  });

  it(`waitForBackground() - should receive waitForBackgroundDone from device and resolve`, async () => {
    await connect();
    client.ws.send.mockReturnValueOnce(response("waitForBackgroundDone", {}, 1));
    await client.waitForBackground();

    expect(client.ws.send).toHaveBeenCalledTimes(2);
  });

  it(`waitForActive() - should receive waitForActiveDone from device and resolve`, async () => {
    await connect();
    client.ws.send.mockReturnValueOnce(response("waitForActiveDone", {}, 1));
    await client.waitForActive();

    expect(client.ws.send).toHaveBeenCalledTimes(2);
  });

  it(`cleanup() - if connected should send cleanup action and close websocket`, async () => {
    await connect();
    client.ws.send.mockReturnValueOnce(response("ready", {}, 1));
    await client.waitUntilReady();
    client.ws.send.mockReturnValueOnce(response("cleanupDone", {}, 2));
    await client.cleanup();

    expect(client.ws.send).toHaveBeenCalledTimes(3);
  });

  it(`cleanup() - if connected should accept testeeDisconnected action too`, async () => {
    await connect();
    client.ws.send.mockReturnValueOnce(response("ready", {}, 1));
    await client.waitUntilReady();
    client.ws.send.mockReturnValueOnce(response("testeeDisconnected", {}, 2));
    await client.cleanup();

    expect(client.ws.send).toHaveBeenCalledTimes(3);
  });

  it(`cleanup() - if not connected should do nothing`, async () => {
    client = new Client(config);
    client.ws.send.mockReturnValueOnce(response("cleanupDone", {}, 1));
    await client.cleanup();

    expect(client.ws.send).not.toHaveBeenCalled();
  });

  it(`cleanup() - if "connected" but ws is closed should do nothing`, async () => {
    await connect();
    client.ws.send.mockReturnValueOnce(response("ready", {}, 1));
    await client.waitUntilReady();

    client.ws.isOpen.mockReturnValue(false);
    await client.cleanup();

    expect(client.ws.send).toHaveBeenCalledTimes(2);
  });

  it(`execute() - "invokeResult" on an invocation object should resolve`, async () => {
    await connect();
    client.ws.send.mockReturnValueOnce(response("invokeResult", {result: "(GREYElementInteraction)"}, 1));

    const call = invoke.call(invoke.IOS.Class('GREYMatchers'), 'matcherForAccessibilityLabel:', 'test');
    await client.execute(call());

    expect(client.ws.send).toHaveBeenCalledTimes(2);
  });

  it(`execute() - fast invocation should not trigger "slowInvocationStatus"`, async () => {
    argparse.getArgValue.mockReturnValue(2); // set debug-slow-invocations
    await connect();
    await executeWithSlowInvocation(1);
    expect(client.ws.send).toHaveBeenLastCalledWith({"params": {"args": ["test"], "method": "matcherForAccessibilityLabel:", "target": {"type": "Class", "value": "GREYMatchers"}}, "type": "invoke"}, undefined);
    expect(client.ws.send).toHaveBeenCalledTimes(2);
  });

  it(`execute() - slow invocation should trigger "slowInvocationStatus:`, async () => {
    argparse.getArgValue.mockReturnValue(2); // set debug-slow-invocations
    await connect();
    await executeWithSlowInvocation(4);
    expect(client.ws.send).toHaveBeenLastCalledWith({"params": {}, "type": "currentStatus"}, undefined);
    expect(client.ws.send).toHaveBeenCalledTimes(3);
  });

  it(`execute() - slow invocation should do nothing if ws was closed`, async () => {
    argparse.getArgValue.mockReturnValue(2); // set debug-slow-invocations
    await connect();
    client.ws.isOpen.mockReturnValue(false);
    await executeWithSlowInvocation(4);

    expect(client.ws.send).toHaveBeenCalledTimes(2);
  });

  it(`execute() - "invokeResult" on an invocation function should resolve`, async () => {
    await connect();
    client.ws.send.mockReturnValueOnce(response("invokeResult", {result: "(GREYElementInteraction)"}, 1));

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

  it(`execute() - should throw if non-error is thrown`, async () => {
    await connect();
    client.ws.send.mockRejectedValueOnce("non-error");
    const call = invoke.call(invoke.IOS.Class('GREYMatchers'), 'matcherForAccessibilityLabel:', 'test');
    try {
      await client.execute(call);
    } catch (ex) {
      expect(ex.message).toBe("non-error");
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

  it(`dumpPendingRequests() - should not dump if no pending requests`, async () => {
    await connect();
    client.dumpPendingRequests();
    expect(log.warn).not.toHaveBeenCalled();
  });

  it(`dumpPendingRequests() - should not dump if there are only currentStatus requests (debug-synchronization)`, async () => {
    await connect();

    const currentStatus = { message: new actions.CurrentStatus(), resolve: jest.fn(), reject: jest.fn() };
    client.ws.inFlightPromises = {
      [currentStatus.message.messageId]: currentStatus
    };

    client.dumpPendingRequests();
    expect(log.warn).not.toHaveBeenCalled();
  });

  describe('dumpPendingRequests() - if there are pending requests -', () => {
    beforeEach(async () => {
      await connect();

      const cleanup = { message: new actions.Cleanup(), resolve: jest.fn(), reject: jest.fn() };
      client.ws.inFlightPromises = {
        [cleanup.message.messageId]: cleanup
      };
    });

    it(`should dump generic message if not testName is specified`, async () => {
      client.dumpPendingRequests();
      expect(log.warn.mock.calls[0]).toMatchSnapshot();
      expect(log.warn.mock.calls[0][1]).toMatch(/Unresponded network requests/);
    });

    it(`should dump specific message if testName is specified`, async () => {
      client.dumpPendingRequests({testName: "Login screen should log in"});
      expect(log.warn.mock.calls[0]).toMatchSnapshot();
      expect(log.warn.mock.calls[0][1]).toMatch(/Login screen should log in/);
    });

    it(`should reset in flight promises`, async () => {
      expect(client.ws.resetInFlightPromises).not.toHaveBeenCalled();
      client.dumpPendingRequests();
      expect(client.ws.resetInFlightPromises).toHaveBeenCalled();
    });
  });

  it(`save a pending error if AppWillTerminateWithError event is sent to tester`, async () => {
    client.ws.setEventCallback = jest.fn();
    await connect();

    triggerAppWillTerminateWithError();

    expect(client.getPendingCrashAndReset()).toBeDefined();

    function triggerAppWillTerminateWithError() {
      const event = JSON.stringify({
        type: "AppWillTerminateWithError",
        params: {errorDetails: "someDetails"},
        messageId: -10000
      });

      client.ws.setEventCallback.mock.calls[0][1](event);
    }
  });

  async function connect() {
    client = new Client(config);
    client.ws.send.mockReturnValueOnce(response("loginSuccess", {}, 1));
    await client.connect();
    client.ws.isOpen.mockReturnValue(true);
  }

  function response(type, params, messageId) {
    return Promise.resolve(
      JSON.stringify({
        type: type,
        params: params,
        messageId: messageId
      }));
  }

  async function executeWithSlowInvocation(invocationTime) {
    client.ws.send.mockReturnValueOnce(timeout(invocationTime).then(()=> response("invokeResult", {result:"(GREYElementInteraction)"}, 1)))
          .mockReturnValueOnce(response("currentStatusResult", {"state":"busy","resources":[{"name":"App State","info":{"prettyPrint":"Waiting for network requests to finish.","elements":["__NSCFLocalDataTask:0x7fc95d72b6c0"],"appState":"Waiting for network requests to finish."}},{"name":"Dispatch Queue","info":{"queue":"OS_dispatch_queue_main: com.apple.main-thread[0x10805ea80] = { xrefcnt = 0x80000000, refcnt = 0x80000000, target = com.apple.root.default-qos.overcommit[0x10805f1c0], width = 0x1, state = 0x000fffe000000403, in-flight = 0, thread = 0x403 }","prettyPrint":"com.apple.main-thread"}}]}, 2));

    const call = invoke.call(invoke.IOS.Class('GREYMatchers'), 'matcherForAccessibilityLabel:', 'test');
    await client.execute(call);
  }

  async function timeout(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
});
