const failedToReachTheApp = require('../../errors/longreads/failedToReachTheApp');

const RegisteredConnectionHandler = require('./RegisteredConnectionHandler');

class TesterConnectionHandler extends RegisteredConnectionHandler {
  constructor({ api, session }) {
    super({ api, session, role: 'tester' });
  }

  handle(action) {
    /* istanbul ignore next */
    if (super.handle(action)) {
      return true;
    }

    if (this._session.app) {
      this._session.app.sendAction(action);
      return true;
    }

    if (action.type === 'cleanup') {
      // returns "cleanupDone" stub
      // for the case when no app is already running
      this._api.sendAction({
        type: 'cleanupDone',
        messageId: action.messageId
      });

      return true;
    }

    throw failedToReachTheApp.maybeAppWasNotLaunched(action);
  }
}

module.exports = TesterConnectionHandler;
