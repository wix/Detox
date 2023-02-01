// @ts-nocheck
const { serializeError } = require('serialize-error');

const DetoxInternalError = require('../../errors/DetoxInternalError');

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
        throw new DetoxInternalError(`Cannot log in twice into the same session (${this._session.id}) being "${this._role}" already`);
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
      this._api.log.error({ err }, 'Cannot forward the error details to the tester due to the error:');
      throw error;
    }
  }
}

module.exports = RegisteredConnectionHandler;
