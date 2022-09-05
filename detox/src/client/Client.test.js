// @ts-nocheck
jest.useFakeTimers('modern');

const { serializeError } = require('serialize-error');
const tempfile = require('tempfile');

const { validSession } = require('../configuration/configurations.mock');
const Deferred = require('../utils/Deferred');

const actions = require('./actions/actions');

describe('Client', () => {
  let log;
  let sessionConfig;
  let Client;
  /** @type {Client} */
  let client;
  /** @type {AsyncWebSocket} */
  let mockAws;
  let DetoxRuntimeError;
  let DetoxInternalError;

  beforeEach(() => {
    jest.clearAllTimers();
    sessionConfig = { ...validSession };

    jest.mock('../utils/logger');
    log = require('../utils/logger');
    log._level.mockReturnValue('debug');

    const AsyncWebSocket = jest.genMockFromModule('./AsyncWebSocket');
    mockAws = new AsyncWebSocket();
    mockAws.isOpen = false;
    mockAws.__appConnected = true;
    mockAws.open.mockImplementation(async () => {
      mockAws.isOpen = true;
      for (const [type, params] of mockAws._responseQueue) {
        mockAws.mockResponse(type, params);
      }

      mockAws.mockResponse('loginSuccess', {
        testerConnected: true,
        appConnected: mockAws.__appConnected,
      });
    });

    mockAws.close.mockImplementation(async () => {

    });

    mockAws.mockBusy = () => {
      const deferred = new Deferred();
      mockAws.send.mockImplementationOnce(() => deferred.promise);
      return deferred;
    };

    mockAws.mockResponse = (type, params) => {
      mockAws.send.mockResolvedValueOnce({ type, params });
    };

    mockAws._responseQueue = [];
    mockAws.mockResponseAfterOpen = (type, params) => {
      mockAws._responseQueue.push([type, params]);
    };

    mockAws.mockSyncError = (message) => {
      mockAws.send.mockImplementation(() => {
        throw new Error(message);
      });
    };

    const mockEvents = {};
    mockAws.setEventCallback.mockImplementation((eventType, handler) => {
      mockEvents[eventType] = mockEvents[eventType] || [];
      mockEvents[eventType].push(handler);
    });

    mockAws.mockEventCallback = (eventType, ...args) => {
      const handlers = mockEvents[eventType] || [];
      for (const handler of handlers) {
        handler(...args);
      }
    };

    jest.mock('./AsyncWebSocket', () => {
      return class FakeAsyncWebSocket {
        constructor() {
          return mockAws;
        }
      };
    });

    Client = require('./Client');
    client = new Client(sessionConfig);
    ({ DetoxInternalError, DetoxRuntimeError } = require('../errors'));
  });

  describe('.isConnected', () => {
    it('should be false if the web socket is closed', () => {
      mockAws.isOpen = false;
      expect(client.isConnected).toBe(false);
    });

    it('should be false if the web socket is closed although app has sent the "appConnected" message previously', () => {
      mockAws.isOpen = true;
      mockAws.mockEventCallback('appConnected');
      mockAws.isOpen = false;

      expect(client.isConnected).toBe(false);
    });

    it('should be false if the server has not sent the "appConnected" message', () => {
      mockAws.isOpen = true;
      expect(client.isConnected).toBe(false);
    });

    it('should be true if the web socket is open and the server has sent "appConnected" message', () => {
      expect(client.isConnected).toBe(false);
      mockAws.isOpen = true;
      mockAws.mockEventCallback('appConnected');
      expect(client.isConnected).toBe(true);
    });
  });

  describe('.serverUrl', () => {
    it('should return sessionConfig.server', () => {
      expect(client.serverUrl).toBe(sessionConfig.server);
    });
  });

  describe('.open()', () => {
    it('should open the web socket', async () => {
      mockAws.mockResponse('loginSuccess', {});
      expect(mockAws.open).not.toHaveBeenCalled();
      await client.open();
      expect(mockAws.open).toHaveBeenCalled();
    });
  });

  describe('.connect()', () => {
    it('should open the web socket', async () => {
      mockAws.mockResponse('loginSuccess', {});
      expect(mockAws.open).not.toHaveBeenCalled();
      await client.connect();
      expect(mockAws.open).toHaveBeenCalled();
    });

    it('should send "login" action', async () => {
      mockAws.mockResponse('loginSuccess', {});
      expect(mockAws.send).not.toHaveBeenCalled();
      await client.connect();
      expect(mockAws.send).toHaveBeenCalledWith(new actions.Login(validSession.sessionId), SEND_OPTIONS.TIMED_SHORT);
    });

    it('should not consider itself connected to the app if "loginSuccess" params.appConnected = false', async () => {
      mockAws.__appConnected = false;
      await client.connect();
      expect(client.isConnected).toBe(false);
    });

    it('should consider itself connected to the app if "loginSuccess" params.appConnected = true', async () => {
      mockAws.__appConnected = true;
      await client.connect();
      expect(client.isConnected).toBe(true);
    });

    it('should not schedule "currentStatus" query for the "login" action', async () => {
      mockAws.mockBusy();
      client.connect();
      await Promise.resolve();
      expect(jest.getTimerCount()).toBe(0);
    });
  });

  describe('.sendAction()', () => {

    class ActionWithoutParams extends actions.Action {
      constructor() {
        super('ActionWithoutParams');
      }

      async handle(response) {
        this.expectResponseOfType(response, 'ActionWithoutParams');
      }
    }

    beforeEach(async () => {
      await client.connect();
    });

    it('should throw error for actions without isAtomic', async () => {
      const withoutConcurrent = new ActionWithoutParams();
      await expect(() => !withoutConcurrent.isAtomic).toThrowErrorMatchingSnapshot();
    });

    it('should throw error for actions without timeout', async () => {
      const withoutTimeout = new ActionWithoutParams();
      await expect(() => withoutTimeout.timeout).toThrowErrorMatchingSnapshot();
    });

    it('should not throw .isAtomic getter errors for exported actions', () => {
      for (const ActionClass of Object.values(actions)) {
        if (ActionClass !== actions.Action && ActionClass.prototype instanceof actions.Action) {
          expect(() => ActionClass.prototype.isAtomic).not.toThrow();
        }
      }
    });

    it('should not throw .timeout getter errors for exported actions', () => {
      for (const ActionClass of Object.values(actions)) {
        if (ActionClass !== actions.Action && ActionClass.prototype instanceof actions.Action) {
          expect(() => ActionClass.prototype.timeout).not.toThrow();
        }
      }
    });

    it('should return value for isAtomic', async () => {
      const withoutConcurrent = new actions.ReloadReactNative();
      await expect(withoutConcurrent.isAtomic).toBe(false);
    });

    it('should return value for timeout', async () => {
      const withoutTimeout = new actions.Login(123);
      await expect(withoutTimeout.timeout).toEqual(1000);
    });

    it('should schedule "currentStatus" query when it takes too long', async () => {
      const { action } = await simulateInFlightAction();
      expect(mockAws.send).toHaveBeenCalledWith(action, SEND_OPTIONS.DEFAULT);
      expect(mockAws.send).toHaveBeenCalledTimes(2); // action + login

      mockAws.mockBusy(); // for the current status query
      jest.advanceTimersByTime(validSession.debugSynchronization);
      await fastForwardAllPromises();

      expect(mockAws.send).toHaveBeenCalledWith(new actions.CurrentStatus(), SEND_OPTIONS.TIMED);
      expect(jest.getTimerCount()).toBe(0); // should not spam with "currentStatus" queries
    });

    it('should not schedule "currentStatus" query if config.debugSynchronization = 0', async () => {
      client = new Client({
        ...sessionConfig,
        debugSynchronization: 0,
      });

      await client.connect();
      await simulateInFlightAction();

      expect(jest.getTimerCount()).toBe(0);
    });

    it('should consistently run "currentStatus" queries when it takes too long', async () => {
      await simulateInFlightAction();

      mockAws.mockResponse('currentStatusResult', { status: { app_status: 'idle' } });
      jest.advanceTimersByTime(validSession.debugSynchronization);

      expect(jest.getTimerCount()).toBe(0);
      await fastForwardAllPromises();
      expect(jest.getTimerCount()).toBe(1); // should schedule next "currentStatus"
    });

    it('should unschedule "currentStatus" query when there is a response', async () => {
      const { deferred } = await simulateInFlightAction();

      expect(jest.getTimerCount()).toBe(1);

      deferred.resolve(JSON.stringify({ type: 'whateverDone' }));
      await fastForwardAllPromises();
      expect(jest.getTimerCount()).toBe(0);
    });

    it('should unschedule "currentStatus" query when app suddenly disconnects', async () => {
      await simulateInFlightAction();
      expect(jest.getTimerCount()).toBe(1);
      mockAws.mockEventCallback('appDisconnected');
      jest.advanceTimersByTime(validSession.debugSynchronization);
      await fastForwardAllPromises();
      expect(jest.getTimerCount()).toBe(0);
    });

    it('should unschedule "currentStatus" query when we eventually get an error', async () => {
      const { deferred, sendPromise } = await simulateInFlightAction();
      expect(jest.getTimerCount()).toBe(1);

      deferred.reject(new Error());
      await expect(sendPromise).rejects.toThrowError();
      expect(jest.getTimerCount()).toBe(0);
    });

    it('should unschedule "currentStatus" query on unforeseen non-async errors', async () => {
      mockAws.mockSyncError('Socket error');
      await expect(client.sendAction(anAction())).rejects.toThrow('Socket error');
      expect(jest.getTimerCount()).toBe(0);
    });

    it('should not spam with "currentStatus" queries when the previous currentStatus is not answered', async () => {
      await simulateInFlightAction();
      mockAws.mockBusy(); // for currentStatus
      jest.advanceTimersByTime(validSession.debugSynchronization);
      await fastForwardAllPromises();
      expect(jest.getTimerCount()).toBe(0);
    });

    it('should stop querying the "currentStatus" if the request completes badly', async () => {
      const testError = new Error('GenericServerError');
      await simulateInFlightAction();
      mockAws.mockResponse('serverError', { error: serializeError(testError) }); // for currentStatus
      jest.advanceTimersByTime(validSession.debugSynchronization);
      await fastForwardAllPromises();

      expect(log.debug).toHaveBeenCalledWith({ event: 'APP_STATUS' }, 'Failed to execute the current status query.');
      expect(jest.getTimerCount()).toBe(0);
    });

    it('should rethrow generic "serverError" message from the server', async () => {
      const testError = new Error('GenericServerError');
      mockAws.mockResponse('serverError', { error: serializeError(testError) });

      await expect(client.sendAction(anAction())).rejects.toThrowError('GenericServerError');
    });

    it('should pass action to async web socket', async () => {
      mockAws.mockResponse('whateverDone');
      const action = anAction();
      await client.sendAction(action);
      expect(mockAws.send).toHaveBeenCalledWith(action, SEND_OPTIONS.DEFAULT);
    });

    it('should pass the parsed response to action.handle()', async () => {
      const action = anAction();
      const response = {
        type: 'whateverDone',
        params: {
          foo: 'bar',
        },
      };
      mockAws.mockResponse(response.type, response.params);
      await client.sendAction(action);
      expect(action.handle).toHaveBeenCalledWith(response);
    });

    it('should return the result from action.handle()', async () => {
      const action = anAction();
      action.handle.mockResolvedValue(42);

      mockAws.mockResponse('whateverDone');
      await expect(client.sendAction(action)).resolves.toBe(42);
    });
  });

  describe('wrapper methods', () => {
    describe.each([
      ['reloadReactNative', 'ready', actions.ReloadReactNative],
      ['deliverPayload', 'deliverPayloadDone', actions.DeliverPayload, { foo: 'bar' }],
      ['setSyncSettings', 'setSyncSettingsDone', actions.SetSyncSettings, { foo: 'bar' }],
      ['shake', 'shakeDeviceDone', actions.Shake],
      ['setOrientation', 'setOrientationDone', actions.SetOrientation, 'portrait'],
      ['startInstrumentsRecording', 'setRecordingStateDone', actions.SetInstrumentsRecordingState, { recordingPath: 'foo', samplingInterval: 500 }],
      ['stopInstrumentsRecording', 'setRecordingStateDone', actions.SetInstrumentsRecordingState],
      ['captureViewHierarchy', 'captureViewHierarchyDone', actions.CaptureViewHierarchy, { viewHierarchyURL: 'foo' }, {}],
      ['waitForBackground', 'waitForBackgroundDone', actions.WaitForBackground],
      ['waitForActive', 'waitForActiveDone', actions.WaitForActive],
      ['waitUntilReady', 'ready', actions.Ready],
      ['currentStatus', 'currentStatusResult', actions.CurrentStatus, {}, { status: { app_status: 'idle' } }],
    ])('.%s', (methodName, expectedResponseType, Action, params, expectedResponseParams) => {
      beforeEach(async () => {
        await client.connect();
      });

      it(`should receive "${expectedResponseType}" from device and resolve`, async () => {
        mockAws.mockResponse(expectedResponseType, expectedResponseParams);
        await client[methodName](params);

        const action = new Action(params);
        expect(mockAws.send).toHaveBeenCalledWith(action, { timeout: expect.any(Number) });
      });

      it(`should throw on a wrong response from device`, async () => {
        mockAws.mockResponse('boo');
        await expect(client[methodName](params)).rejects.toThrowError();
      });
    });
  });

  describe('.captureViewHierarchy()', () => {
    beforeEach(async () => {
      await client.connect();
    });

    it(`should throw an error if the response has "captureViewHierarchyError" in params`, async () => {
      mockAws.mockResponse('captureViewHierarchyDone', {
        captureViewHierarchyError: 'Test error to check',
      });

      const viewHierarchyURL = tempfile('.viewhierarchy');
      await expect(client.captureViewHierarchy({ viewHierarchyURL })).rejects.toThrowError(/Test error to check/m);
    });
  });

  describe('.cleanup()', () => {
    it('should cancel "currentStatus" query', async () => {
      await simulateInFlightAction();
      expect(jest.getTimerCount()).toBe(1);

      await client.cleanup();
      expect(jest.getTimerCount()).toBe(0);
    });

    it('should not send cleanup action if it is not connected to the app', async () => {
      await client.cleanup();
      expect(mockAws.send).not.toHaveBeenCalled();
    });

    it('should not send cleanup action if the app is crashing', async () => {
      await client.connect();
      mockAws.send.mockReset();
      mockAws.mockEventCallback('AppWillTerminateWithError', {
        params: { errorDetails: new Error() }
      });

      await client.cleanup();
      expect(mockAws.send).not.toHaveBeenCalled();
    });

    it('should send cleanup action to the app', async () => {
      await client.connect();
      mockAws.mockResponse('cleanupDone');
      await client.cleanup();
      expect(mockAws.send).toHaveBeenCalledWith(new actions.Cleanup(true), SEND_OPTIONS.TIMED);
    });

    it('should send cleanup action (stopRunner=false) to the app if there were failed invocations', async () => {
      await client.connect();
      mockAws.mockResponse('testFailed', { details: 'SomeDetails' });
      await expect(client.execute(anInvocation)).rejects.toThrowError(/Test Failed.*SomeDetails/);
      mockAws.mockResponse('cleanupDone');
      await client.cleanup();
      expect(mockAws.send).toHaveBeenCalledWith(new actions.Cleanup(false), SEND_OPTIONS.TIMED);
    });

    it('should close the websocket upon "cleanupDone" from the app', async () => {
      await client.connect();
      mockAws.mockResponse('cleanupDone');
      await client.cleanup();
      expect(mockAws.close).toHaveBeenCalled();
    });

    it('should close the websocket even if getting "cleanupDone" fails', async () => {
      await client.connect();
      mockAws.mockResponse('serverError');
      await client.cleanup();
      expect(mockAws.close).toHaveBeenCalled();
    });

    it('should close the websocket even on an inner error', async () => {
      await client.connect();
      mockAws.mockSyncError('MyError');
      await client.cleanup();
      expect(mockAws.close).toHaveBeenCalled();
      expect(log.error).toHaveBeenCalledWith({ event: 'ERROR' }, expect.stringContaining('MyError'));
    });

    it('should not bail even if the world is crashing, instead it should log errors and exit calmly', async () => {
      await client.connect();

      mockAws.send.mockRejectedValue('MyError1');
      mockAws.close.mockRejectedValue('MyError2');

      await client.cleanup();

      expect(mockAws.close).toHaveBeenCalled();
      expect(log.error).toHaveBeenCalledWith({ event: 'ERROR' }, expect.stringContaining('MyError1'));
      expect(log.error).toHaveBeenCalledWith({ event: 'ERROR' }, expect.stringContaining('MyError2'));
    });

    it('should delete the injected .terminateApp method', async () => {
      const injected = client.terminateApp = jest.fn();
      await client.cleanup();
      expect(client.terminateApp).not.toBe(injected);
    });
  });

  describe('.execute()', () => {
    beforeEach(async () => {
      await client.connect();
    });

    test(`"invokeResult" on an invocation object should return invokeResult`, async () => {
      mockAws.mockResponse('invokeResult', { result: 'some_result' });
      const invokeObject = anInvocation();
      const invokeResult = await client.execute(invokeObject);
      expect(invokeResult).toEqual({ result: 'some_result' });
    });

    test(`"invokeResult" on an invocation function should resolve`, async () => {
      mockAws.mockResponse('invokeResult', { result: 'some_result' });
      const invokeResult = await client.execute(anInvocation);
      expect(invokeResult).toEqual({ result: 'some_result' });
    });

    it.each([
      ['debug'],
      ['trace'],
    ])(`should throw "testFailed" error with view hierarchy (on --loglevel %s)`, async (loglevel) => {
      log._level.mockReturnValue(loglevel);
      mockAws.mockResponse('testFailed',  { details: 'this is an error', viewHierarchy: 'mock-hierarchy' });
      await expect(client.execute(anInvocation)).rejects.toThrowErrorMatchingSnapshot();
    });

    it.each([
      ['error'],
      ['warn'],
      ['info'],
    ])(`should throw "testFailed" error without view hierarchy but with a hint (on --loglevel %s)`, async (loglevel) => {
      log._level.mockReturnValue(loglevel);
      mockAws.mockResponse('testFailed',  { details: 'this is an error', viewHierarchy: 'mock-hierarchy' });
      const executionPromise = client.execute(anInvocation);
      await expect(executionPromise).rejects.toThrowErrorMatchingSnapshot();
      await expect(executionPromise).rejects.toThrowError(DetoxRuntimeError);
    });

    it(`should throw "testFailed" error even if it has no a view hierarchy`, async () => {
      mockAws.mockResponse('testFailed',  { details: 'this is an error', viewHierarchy: undefined });

      const executionPromise = client.execute(anInvocation);
      await expect(executionPromise).rejects.toThrowErrorMatchingSnapshot();
      await expect(executionPromise).rejects.toThrowError(DetoxRuntimeError);
    });

    it(`should rethrow an "error" result`, async () => {
      mockAws.mockResponse('error',  { error: 'this is an error' });
      const executionPromise = client.execute(anInvocation);
      await expect(executionPromise).rejects.toThrowErrorMatchingSnapshot();
      await expect(executionPromise).rejects.toThrowError(DetoxRuntimeError);
    });

    it(`should throw even if a non-error object is thrown`, async () => {
      mockAws.send.mockRejectedValueOnce('non-error');
      await expect(client.execute(anInvocation)).rejects.toThrowErrorMatchingSnapshot();
    });

    it(`should throw on an unsupported result`, async () => {
      mockAws.mockResponse('unsupportedResult',  { foo: 'bar' });
      const executionPromise = client.execute(anInvocation);
      await expect(executionPromise).rejects.toThrowErrorMatchingSnapshot();
      await expect(executionPromise).rejects.toThrowError(DetoxInternalError);
    });
  });

  describe('.dumpPendingRequests()', () => {
    beforeEach(async () => {
      await client.connect();
    });

    describe('if there was a prior unsuccessful attempt to launch the app launch', () => {
      beforeEach(async () => {
        mockAws.mockEventCallback('appDisconnected');
        client.waitUntilReady();
      });

      it(`should log an error about the app being unreachable over web sockets`, async () => {
        await client.dumpPendingRequests();
        expect(log.error.mock.calls[0][0]).toEqual({ event: 'APP_UNREACHABLE' });
        expect(log.error.mock.calls[0][1]).toMatch(/Detox can't seem to connect to the test app./);
      });
    });

    it(`should not dump if there are no pending requests`, async () => {
      client.dumpPendingRequests();
      expect(log.warn).not.toHaveBeenCalled();
    });

    it(`should not dump if there are only currentStatus requests (debug-synchronization)`, async () => {
      const currentStatus = new Deferred();
      currentStatus.message = new actions.CurrentStatus();
      mockAws.inFlightPromises = { 1: currentStatus };

      client.dumpPendingRequests();
      expect(log.warn).not.toHaveBeenCalled();
    });

    describe('if there are pending requests -', () => {
      beforeEach(async () => {
        const stuckRequest = new Deferred();
        stuckRequest.message = new actions.ReloadReactNative();

        mockAws.hasPendingActions.mockReturnValue(true);
        mockAws.inFlightPromises = {
          [stuckRequest.message.messageId]: stuckRequest
        };
      });

      it(`should dump generic message if not testName is specified`, async () => {
        client.dumpPendingRequests();
        expect(log.warn.mock.calls[0][0]).toEqual({ event: 'PENDING_REQUESTS' });
        expect(log.warn.mock.calls[0][1]).toMatch(/Unresponded network requests/);
      });

      it(`should dump specific message if testName is specified`, async () => {
        client.dumpPendingRequests({ testName: 'Login screen should log in' });
        expect(log.warn.mock.calls[0][0]).toEqual({ event: 'PENDING_REQUESTS' });
        expect(log.warn.mock.calls[0][1]).toMatch(/Login screen should log in/);
      });

      it(`should reset in flight promises`, async () => {
        expect(mockAws.resetInFlightPromises).not.toHaveBeenCalled();
        client.dumpPendingRequests();
        expect(mockAws.resetInFlightPromises).toHaveBeenCalled();
      });
    });
  });

  describe('on AppNonresponsiveDetected', () => {
    it('should log a warning', () => {
      mockAws.mockEventCallback('AppNonresponsiveDetected', {
        params: { threadDump: 'THREAD_DUMP' }
      });

      expect(log.warn).toHaveBeenCalledWith({ event: 'APP_NONRESPONSIVE' }, expect.stringContaining('THREAD_DUMP'));
      expect(log.warn.mock.calls[0][1]).toMatchSnapshot();
    });
  });

  describe('.waitUntilReady()', () => {
    it('should wait until connected, then send Ready action', async () => {
      let isReady = false;
      client.waitUntilReady().then(() => { isReady = true; });

      await fastForwardAllPromises();
      expect(isReady).toBe(false);
      expect(mockAws.send).not.toHaveBeenCalled();

      mockAws.__appConnected = false;
      await client.connect();
      mockAws.mockEventCallback('appConnected');
      mockAws.mockResponse('ready');
      await fastForwardAllPromises();
      expect(mockAws.send).toHaveBeenCalledWith(new actions.Ready(), SEND_OPTIONS.DEFAULT);
      expect(isReady).toBe(true);
    });

    it('should wait until connected and ready, if the app sends ready status beforehand', async () => {
      let isReady = false;
      client.waitUntilReady().then(() => { isReady = true; });

      mockAws.mockEventCallback('ready');
      await fastForwardAllPromises();
      expect(isReady).toBe(false);

      await client.connect();
      await fastForwardAllPromises();
      expect(isReady).toBe(true);
      expect(mockAws.send).not.toHaveBeenCalledWith(new actions.Ready(), expect.anything());
    });
  });

  describe('on AppWillTerminateWithError', () => {
    it('should schedule the app termination in 5 seconds, and reject pending', async () => {
      jest.spyOn(client, 'terminateApp');

      await client.connect();

      mockAws.mockEventCallback('AppWillTerminateWithError', {
        params: { errorDetails: 'SIGSEGV whatever' },
      });
      expect(client.terminateApp).not.toHaveBeenCalled();
      expect(mockAws.rejectAll).not.toHaveBeenCalled();

      jest.advanceTimersByTime(5000);
      await fastForwardAllPromises();
      expect(client.terminateApp).toHaveBeenCalled();
      expect(mockAws.rejectAll).not.toHaveBeenCalled();

      mockAws.mockEventCallback('appDisconnected');
      expect(mockAws.rejectAll.mock.calls[0][0]).toMatchSnapshot();
      expect(log.error).not.toHaveBeenCalled();
    });

    it('should log errors if the app termination does not go well', async () => {
      jest.spyOn(client, 'terminateApp');
      client.terminateApp.mockImplementation(() => {
        throw new Error('TestError');
      });

      await client.connect();
      mockAws.mockEventCallback('AppWillTerminateWithError', {
        params: { errorDetails: 'SIGSEGV whatever' },
      });

      jest.advanceTimersByTime(5000);
      await fastForwardAllPromises();

      expect(client.terminateApp).toHaveBeenCalled();
      expect(log.error).toHaveBeenCalledWith({ event: 'ERROR' }, expect.stringContaining('TestError'));
    });

    it('should unschedule the app termination if it disconnects earlier', async () => {
      jest.spyOn(client, 'terminateApp');

      await client.connect();

      mockAws.mockEventCallback('AppWillTerminateWithError', {
        params: { errorDetails: 'SIGSEGV whatever' },
      });
      mockAws.mockEventCallback('appDisconnected');

      expect(client.terminateApp).not.toHaveBeenCalled();
      expect(mockAws.rejectAll.mock.calls[0][0]).toMatchSnapshot();

      jest.advanceTimersByTime(5000);
      await fastForwardAllPromises();

      expect(client.terminateApp).not.toHaveBeenCalled();
    });

  });

  describe('on appDisconnected', () => {
    it('should reject pending actions', async () => {
      await client.connect();
      await simulateInFlightAction(new actions.Invoke(anInvocation()));
      mockAws.mockEventCallback('appDisconnected');
      await fastForwardAllPromises();
      expect(mockAws.rejectAll).toHaveBeenCalled();
    });

    it('should return .isConnected = false', async () => {
      await client.connect();
      expect(client.isConnected).toBe(true);
      mockAws.mockEventCallback('appDisconnected');
      await fastForwardAllPromises();
      expect(client.isConnected).toBe(false);
    });
  });

  describe('on unhandled serverError', () => {
    beforeEach(async () => client.connect());

    it('should log an error', async () => {
      const testError = new Error('TEST ERROR');
      mockAws.mockEventCallback('serverError', {
        params: {
          error: serializeError(testError)
        },
      });

      expect(log.error.mock.calls[0][1]).toMatchSnapshot();
    });

    it('should log a fallback error if the details were empty', async () => {
      mockAws.mockEventCallback('serverError', { somethingElse: 0 });
      expect(log.error.mock.calls[0][1]).toMatchSnapshot();
      mockAws.mockEventCallback('serverError', { somethingElse: 0, params: {} });
      expect(log.error.mock.calls[1][1]).toMatchSnapshot();
    });
  });

  function anAction(overrides) {
    return {
      type: 'whatever',
      params: {},
      handle: jest.fn(),
      get timeout() { return 0; },
      get isAtomic() { return true; },
      ...overrides,
    };
  }

  function anInvocation() {
    return {
      type: 'SomeInvocation',
    };
  }

  async function simulateInFlightAction(action = anAction()) {
    const deferred = mockAws.mockBusy();
    mockAws.hasPendingActions.mockReturnValue(true);

    const sendPromise = client.sendAction(action);
    await Promise.resolve();
    return { sendPromise, action, deferred };
  }

  async function fastForwardAllPromises() {
    for (let i = 0; i < 10; i++) {
      await Promise.resolve();
    }
  }

  const SEND_OPTIONS = {
    DEFAULT: { timeout: 0 },
    TIMED: { timeout: 5000 },
    TIMED_SHORT: { timeout: 1000 }
  };
});
