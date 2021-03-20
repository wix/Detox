const DetoxInvariantError = require('../../errors/DetoxInvariantError');
const { serializeError } = require('serialize-error');

class RegisteredConnectionHandler {
  constructor({ api, role, session }) {
    this._api = api;
    this._api.appendLogDetails({
      trackingId: role,
      sessionId: session.id,
      role,
    });

    this._role = role;
    /** @type {DetoxSession} */
    this._session = session;
  }

  handle(action) {
    switch (action.type) {
      case 'login':
        throw new DetoxInvariantError(`Cannot log in twice into the same session (${this._session.id}) as ${this._role}`);
      default:
        return false;
    }
  }

  onError(error, action) {
    if (!this._session.tester) {
      throw error;
    }

    try {
      this._session.tester.sendAction({
        type: 'serverError',
        params: {
          error: serializeError(error),
        },
        messageId: action && action.messageId,
      });
    } catch (err) {
      this._api.log.error('Cannot forward the error details to the tester, printing it here:\n')
      throw err;
    }
  }
}

module.exports = RegisteredConnectionHandler;
