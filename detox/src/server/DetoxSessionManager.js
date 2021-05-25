const DetoxInternalError = require('../errors/DetoxInternalError');
const log = require('../utils/logger').child({ __filename });

const DetoxConnection = require('./DetoxConnection');
const DetoxSession = require('./DetoxSession');

class DetoxSessionManager {
  constructor() {
    /** @type {Map<WebSocket, DetoxConnection>} **/
    this._connectionsByWs = new Map();
    /** @type {Map<DetoxConnection, DetoxSession>} **/
    this._sessionsByConnection = new Map();
    /** @type {Map<string, DetoxSession>} **/
    this._sessionsById = new Map();
  }

  /**
   * @param {WebSocket} ws
   * @param {Socket} socket
   */
  registerConnection(webSocket, socket) {
    if (!this._assertWebSocketIsNotUsed(webSocket)) {
      return;
    }

    const connection = new DetoxConnection({
      sessionManager: this,
      webSocket,
      socket,
    });

    this._connectionsByWs.set(webSocket, connection);
  }

  /**
   * @param {DetoxConnection} connection
   * @param {'tester' | 'app'} role
   * @param {string} sessionId
   * @returns {DetoxSession}
   */
  registerSession(connection, { role, sessionId }) {
    let session;

    if (this._assertConnectionIsNotInSession(connection)) {
      session = this._sessionsById.get(sessionId);
    } else {
      session = this._sessionsByConnection.get(connection);
    }

    if (!session) {
      session = new DetoxSession(sessionId);
      this._sessionsById.set(sessionId, session);
    }

    this._sessionsByConnection.set(connection, session);
    session[role] = connection;
    return session;
  }

  /**
   * @param {DetoxConnection} connection
   * @returns {DetoxSession|null}
   */
  getSession(connection) {
    const result = this._sessionsByConnection.get(connection) || null;
    return result;
  }

  /**
   * @param {WebSocket} webSocket
   */
  unregisterConnection(webSocket) {
    if (!this._assertWebSocketIsUsed(webSocket)) {
      return;
    }

    const connection = this._connectionsByWs.get(webSocket);
    const session = this._sessionsByConnection.get(connection);

    if (session) {
      session.disconnect(connection);
      session.notify();

      this._sessionsByConnection.delete(connection);
      if (session.isEmpty) {
        this._sessionsById.delete(session.id);
      }
    }

    this._connectionsByWs.delete(webSocket);
  }

  _assertWebSocketIsNotUsed(webSocket) {
    if (!this._connectionsByWs.has(webSocket)) {
      return true;
    }

    this._invariant('Cannot register the same WebSocket instance twice.');
  }

  _assertWebSocketIsUsed(webSocket) {
    if (this._connectionsByWs.has(webSocket)) {
      return true;
    }

    this._invariant('Cannot unregister an unknown WebSocket instance.');
  }

  _assertConnectionIsNotInSession(connection) {
    if (!this._sessionsByConnection.has(connection)) {
      return true;
    }

    this._invariant('Cannot login the same WebSocket instance twice into the same session.');
  }

  _invariant(errorMessage) {
    log.error(DetoxInternalError.from(errorMessage));
  }
}

module.exports = DetoxSessionManager;
