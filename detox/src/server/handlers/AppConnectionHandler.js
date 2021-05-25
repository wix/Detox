const DetoxRuntimeError = require('../../errors/DetoxRuntimeError');

const RegisteredConnectionHandler = require('./RegisteredConnectionHandler');

class AppConnectionHandler extends RegisteredConnectionHandler {
  constructor({ api, session }) {
    super({ api, session, role: 'app' });
  }

  handle(action) {
    /* istanbul ignore next */
    if (super.handle(action)) {
      return true;
    }

    if (this._session.tester) {
      this._session.tester.sendAction(action);
      return true;
    }

    throw new DetoxRuntimeError({
      message: 'Cannot forward the message to the Detox client.',
      debugInfo: action,
      inspectOptions: {
        depth: 3,
      },
    });
  }
}

module.exports = AppConnectionHandler;
