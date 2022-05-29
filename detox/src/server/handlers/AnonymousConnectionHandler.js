// @ts-nocheck
const DetoxInternalError = require('../../errors/DetoxInternalError');
const DetoxRuntimeError = require('../../errors/DetoxRuntimeError');

const AppConnectionHandler = require('./AppConnectionHandler');
const TesterConnectionHandler = require('./TesterConnectionHandler');

class AnonymousConnectionHandler {
  constructor({ api }) {
    this._api = api;
  }

  handle(action) {
    switch (action.type) {
      case 'login': return this._handleLoginAction(action);
      case 'ready': return this._handleEarlyReadyAction(action);
      // case 'testerServerStarted': return this._handleTesterServerStarted(action);
      default: return this._handleUnknownAction(action);
    }
  }

  onError(error, _action) {
    throw error;
  }

  _handleLoginAction(action) {
    if (!action.params) {
      throw new DetoxRuntimeError({
        message: `Invalid login action received, it has no .params`,
        hint: DetoxInternalError.reportIssue,
        debugInfo: action,
      });
    }

    if (action.params.role !== 'app' && action.params.role !== 'tester') {
      throw new DetoxRuntimeError({
        message: `Invalid login action received, it has invalid .role`,
        hint: DetoxInternalError.reportIssue,
        debugInfo: action,
        inspectOptions: { depth: 2 },
      });
    }

    if (!action.params.sessionId) {
      throw new DetoxRuntimeError({
        message: `Invalid login action received, it has no .sessionId`,
        hint: DetoxInternalError.reportIssue,
        debugInfo: action,
        inspectOptions: { depth: 2 },
      });
    }

    if (typeof action.params.sessionId !== 'string') {
      throw new DetoxRuntimeError({
        message: `Invalid login action received, it has a non-string .sessionId`,
        hint: DetoxInternalError.reportIssue,
        debugInfo: action,
        inspectOptions: { depth: 3 },
      });
    }

    const session = this._api.registerSession(action.params);
    const Handler = action.params.role === 'app' ? AppConnectionHandler : TesterConnectionHandler;
    this._api.setHandler(new Handler({
      api: this._api,
      session,
    }));

    this._api.sendAction({
      ...action,
      type: 'loginSuccess',
      params: {
        testerConnected: !!session.tester,
        appConnected: !!session.app,
      },
    });

    session.notify();
  }

  _handleUnknownAction(action) {
    throw new DetoxRuntimeError({
      message: `Action dispatched too early, there is no session to use:`,
      hint: DetoxInternalError.reportIssue,
      debugInfo: action,
    });
  }

  _handleEarlyReadyAction() {
    this._api.log.debug('The app has dispatched "ready" action too early.');
  }

  // _handleTesterServerStarted(action) {
  //   if (!action.params) {
  //     throw new DetoxRuntimeError({
  //       message: `Invalid tester server started action received, it has no .params`,
  //       hint: DetoxInternalError.reportIssue,
  //       debugInfo: action,
  //     });
  //   }
  //
  //   if (!action.params.port) {
  //     throw new DetoxRuntimeError({
  //       message: `Invalid login action received, it has no .port`,
  //       hint: DetoxInternalError.reportIssue,
  //       debugInfo: action,
  //       inspectOptions: { depth: 2 },
  //     });
  //   }
  //
  //   const serverPort = action.params.port;
  //   this._api.log.debug(`XCUITest server is connected with port: ${serverPort}.`);
  //
  //   this._api.setXCUITestServerPort(serverPort);
  // }
}

module.exports = AnonymousConnectionHandler;
