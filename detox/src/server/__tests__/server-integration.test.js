// @ts-nocheck
const FakeWebSocket = require('../__mocks__/FakeWebSocket');

describe('Detox server integration', () => {
  let logger;
  /**
   * @type {typeof require('../DetoxSessionManager')}
   */
  let DetoxSessionManager;
  /**
   * @type {typeof require('../DetoxSession')}
   */
  let DetoxSession;
  /**
   * @type {typeof require('../DetoxConnection')}
   */
  let DetoxConnection;
  /**
   * @type {DetoxSessionManager}
   */
  let sessionManager;

  beforeEach(() => {
    jest.mock('../../utils/logger');
    logger = require('../../utils/logger');
    DetoxSessionManager = require('../DetoxSessionManager');
    DetoxSession = require('../DetoxSession');
    DetoxConnection = require('../DetoxConnection');
    sessionManager = new DetoxSessionManager();
    jest.spyOn(sessionManager, 'registerSession');
    jest.spyOn(sessionManager, 'unregisterConnection');
  });

  test.each([
    ['app'],
    ['tester']
  ])('%j connects first, and then disconnects', async (role) => {
    const webSocket = new FakeWebSocket({ remotePort: 8081 });
    sessionManager.registerConnection(webSocket, webSocket.socket);

    expect(getLoggerMsg('debug', 0, 1)).toMatchSnapshot();
    expect(sessionManager.getSession(webSocket)).toBe(null);

    webSocket.mockLogin({ messageId: 100500, role });

    expect(sessionManager.registerSession).toHaveBeenCalledWith(expect.any(DetoxConnection), {
      role,
      sessionId: 'aSession',
    });

    const [[detoxConnection]] = sessionManager.registerSession.mock.calls;
    const detoxSession = sessionManager.getSession(detoxConnection);
    expect(detoxSession).toBeInstanceOf(DetoxSession);

    expect(webSocket.send).toHaveBeenCalledWith(aMessage({
      type: 'loginSuccess',
      messageId: 100500,
      params: {
        testerConnected: false,
        appConnected: false,
        [role + 'Connected']: true,
      },
    }));

    webSocket.mockClose();
    expect(sessionManager.unregisterConnection).toHaveBeenCalledWith(webSocket);
    expect(sessionManager.getSession(detoxConnection)).toBe(null);
  });

  test('tester and app interconnect and then disconnect', async () => {
    let testerSocket = new FakeWebSocket({ remotePort: 0x7 });
    let appSocket = new FakeWebSocket({ remotePort: 0xA });

    sessionManager.registerConnection(testerSocket, testerSocket.socket);
    testerSocket.mockLogin({ role: 'tester' });

    expect(testerSocket.send).toHaveBeenCalledWith(aMessage({
      type: 'loginSuccess',
      params: {
        testerConnected: true,
        appConnected: false,
      },
    }));

    sessionManager.registerConnection(appSocket, appSocket.socket);
    appSocket.mockLogin({ role: 'app' });

    expect(appSocket.send).toHaveBeenCalledWith(aMessage({
      type: 'loginSuccess',
      params: {
        testerConnected: true,
        appConnected: true,
      },
    }));

    expect(testerSocket.send).toHaveBeenCalledWith(aMessage({ type: 'appConnected' }));

    // app will disconnect
    const [[testerConnection], [appConnection]] = sessionManager.registerSession.mock.calls;
    const detoxSession = sessionManager.getSession(appConnection);
    expect(detoxSession).toBeInstanceOf(DetoxSession);

    appSocket.mockClose();
    expect(testerSocket.send).toHaveBeenCalledWith(aMessage({ type: 'appDisconnected' }));

    expect(sessionManager.getSession(appConnection)).toBe(null); // because the app is disconnected
    expect(sessionManager.getSession(testerConnection)).toBe(detoxSession); // because the tester is still connected

    testerSocket.mockMessage({
      type: 'cleanup',
      messageId: 100,
    });

    // assert tester get a stub cleanup message if the app is not connected
    expect(testerSocket.send).toHaveBeenCalledWith(aMessage({
      type: 'cleanupDone',
      messageId: 100
    }));

    testerSocket.mockMessage({
      type: 'reactNativeReload',
      messageId: 101,
    });

    // assert tester get a serverError explaining the app is unreachable
    expect(testerSocket.send).toHaveBeenCalledWith(expect.stringContaining('"type":"serverError"'));
    expect(testerSocket.send).toHaveBeenCalledWith(expect.stringContaining('Detox can\'t seem to connect to the test app'));

    testerSocket.send.mockReset();

    // app reconnects
    appSocket = new FakeWebSocket({ remotePort: 0xB });
    sessionManager.registerConnection(appSocket, appSocket.socket);
    appSocket.mockLogin({ role: 'app' });
    expect(testerSocket.send).toHaveBeenCalledWith(aMessage({ type: 'appConnected' }));

    // tester sends to app
    const reloadAction = { type: 'reactNativeReload', messageId: 1000 };
    testerSocket.mockMessage(reloadAction);
    expect(appSocket.send).toHaveBeenCalledWith(aMessage(reloadAction));

    // app sends back to tester
    const readyAction = { type: 'ready', messageId: 1000 };
    appSocket.mockMessage(readyAction);
    expect(testerSocket.send).toHaveBeenCalledWith(aMessage(readyAction));

    // tester disconnects
    testerSocket.mockClose();
    expect(appSocket.send).toHaveBeenCalledWith(aMessage({ type: 'testerDisconnected', messageId: -1 }));
    expect(sessionManager.getSession(testerConnection)).toBe(null);

    appSocket.mockMessage({
      type: 'currentStatus',
      messageId: 200,
      params: {
        status: 'I am fine',
      }
    });

    expect(getLoggerMsg('warn', 0, 0)).toEqual({ event: 'ERROR' });
    expect(getLoggerMsg('warn', 0, 1)).toMatchSnapshot('CANNOT_FORWARD');

    // app disconnects
    appSocket.mockClose();
  });

  describe('edge cases', () => {
    let webSocket;

    beforeEach(() => {
      webSocket = new FakeWebSocket({ remotePort: 0xA });
    });

    test('attempt to register the same connection twice', () => {
      sessionManager.registerConnection(webSocket, webSocket.socket);
      expect(logger.error).not.toHaveBeenCalled();
      sessionManager.registerConnection(webSocket, webSocket.socket);
      expect(getLoggerMsg('error')).toMatchSnapshot();
    });

    test('attempt to unregister an unknown connection', () => {
      sessionManager.unregisterConnection(webSocket);
      expect(getLoggerMsg('error')).toMatchSnapshot();
    });

    test('unregistering an anomymous connection', () => {
      sessionManager.registerConnection(webSocket, webSocket.socket);
      sessionManager.unregisterConnection(webSocket);
      expect(logger.error).not.toHaveBeenCalled();
      sessionManager.unregisterConnection(webSocket);
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Cannot unregister'));
    });

    test('on(message) - malformed data', () => {
      sessionManager.registerConnection(webSocket, webSocket.socket);
      webSocket.mockMessage(Buffer.alloc(0));
      expect(getLoggerMsg('warn', 0, 0)).toEqual({ event: 'ERROR' });
      expect(getLoggerMsg('warn', 0, 1)).toMatchSnapshot();
    });

    test('on(message) - no .type', () => {
      sessionManager.registerConnection(webSocket, webSocket.socket);
      webSocket.mockMessage({ some: 'message' });
      expect(getLoggerMsg('warn', 0, 0)).toEqual({ event: 'ERROR' });
      expect(getLoggerMsg('warn', 0, 1)).toMatchSnapshot();
    });

    test('login - empty .params', () => {
      sessionManager.registerConnection(webSocket, webSocket.socket);
      webSocket.mockMessage({ type: 'login' });
      expect(getLoggerMsg('warn', 0, 0)).toEqual({ event: 'ERROR' });
      expect(getLoggerMsg('warn', 0, 1)).toMatchSnapshot();
    });

    test('login - invalid .role', () => {
      sessionManager.registerConnection(webSocket, webSocket.socket);
      webSocket.mockMessage({ type: 'login', params: { sessionId: 'Session', role: 'Meteora' } });
      expect(getLoggerMsg('warn', 0, 0)).toEqual({ event: 'ERROR' });
      expect(getLoggerMsg('warn', 0, 1)).toMatchSnapshot();
    });

    test('login - missing .sessionId', () => {
      sessionManager.registerConnection(webSocket, webSocket.socket);
      webSocket.mockMessage({ type: 'login', params: { sessionId: '', role: 'tester' } });
      expect(getLoggerMsg('warn', 0, 0)).toEqual({ event: 'ERROR' });
      expect(getLoggerMsg('warn', 0, 1)).toMatchSnapshot();
    });

    test('login - non-string .sessionId', () => {
      sessionManager.registerConnection(webSocket, webSocket.socket);
      webSocket.mockMessage({ type: 'login', params: { sessionId: { 0: 2 }, role: 'tester' } });
      expect(getLoggerMsg('warn', 0, 0)).toEqual({ event: 'ERROR' });
      expect(getLoggerMsg('warn', 0, 1)).toMatchSnapshot();
    });

    test('login twice (as tester)', () => {
      sessionManager.registerConnection(webSocket, webSocket.socket);
      webSocket.mockLogin({ role: 'tester' });
      webSocket.mockLogin({ role: 'tester' });
      expect(webSocket.send).toHaveBeenCalledWith(expect.stringContaining('"type":"serverError"'));
      expect(webSocket.send).toHaveBeenCalledWith(expect.stringContaining('Cannot log in twice'));
    });

    test('login twice (as tester) + socket send error', () => {
      sessionManager.registerConnection(webSocket, webSocket.socket);
      webSocket.mockLogin({ role: 'tester' });

      webSocket.send.mockImplementationOnce(() => {
        throw Object.assign(new Error('TestError'), { stack: '' });
      });

      webSocket.mockLogin({ role: 'tester' });
      expect(webSocket.send).toHaveBeenCalledWith(expect.stringContaining('"type":"serverError"'));

      expect(getLoggerMsg('error', 0)).toMatchSnapshot();
      expect(getLoggerMsg('warn', 0, 1)).toMatchSnapshot();
    });

    test('login twice (as app)', () => {
      sessionManager.registerConnection(webSocket, webSocket.socket);
      webSocket.mockLogin({ role: 'app' });
      webSocket.mockLogin({ role: 'app' });
      expect(getLoggerMsg('warn', 0, 0)).toEqual({ event: 'ERROR' });
      expect(getLoggerMsg('warn', 0, 1)).toMatchSnapshot();
    });

    test('.registerSession - calling twice', () => {
      sessionManager.registerConnection(webSocket, webSocket.socket);
      webSocket.mockLogin({ role: 'app' });
      const [[detoxConnection]] = sessionManager.registerSession.mock.calls;
      const priorDetoxSession = sessionManager.getSession(detoxConnection);
      const newDetoxSession = sessionManager.registerSession(detoxConnection, { role: 'app', sessionId: '10101' });

      expect(priorDetoxSession === newDetoxSession).toBe(true); // assert no new sessions were created
      expect(getLoggerMsg('error', 0)).toMatchSnapshot();
    });

    test('receiving an action before we login', () => {
      sessionManager.registerConnection(webSocket, webSocket.socket);
      webSocket.mockMessage({ type: 'reloadReactNative', messageId: -1000 });
      expect(getLoggerMsg('warn', 0, 0)).toEqual({ event: 'ERROR' });
      expect(getLoggerMsg('warn', 0, 1)).toMatchSnapshot();
    });

    test('app dispatches "ready" action before login', async () => {
      sessionManager.registerConnection(webSocket, webSocket.socket);
      webSocket.mockMessage({ type: 'ready', messageId: -1000 });
      expect(getLoggerMsg('debug', 1)).toMatchSnapshot();
    });

    test('socket error', () => {
      sessionManager.registerConnection(webSocket, webSocket.socket);

      const err = new Error('Test error');
      delete err.stack;
      webSocket.mockError(err);

      expect(getLoggerMsg('warn', 0, 0)).toEqual({ event: 'WSS_SOCKET_ERROR' });
      expect(getLoggerMsg('warn', 0, 1)).toMatchSnapshot();
    });
  });

  function getLoggerMsg(level, callIndex = 0, argIndex = 0) {
    return logger[level].mock.calls[callIndex][argIndex];
  }

  function aMessage(obj) {
    return expect.stringContaining(JSON.stringify(obj));
  }
});
