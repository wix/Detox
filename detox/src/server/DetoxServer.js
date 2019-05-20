const _ = require('lodash');
const WebSocket = require('ws');
const WebSocketServer = WebSocket.Server;
const delegatedPromise = require('../utils/delegatedPromise');

const CLOSE_TIMEOUT = 10000;
const ROLE_TESTER = 'tester';
const ROLE_TESTEE = 'testee';

class DetoxServer {
  constructor({ port, log, standalone = false }) {
    this.wss = new WebSocketServer({ port });
    this.sessions = {};
    this.standalone = standalone;
    this.log = log.child({ __filename });
    this.log.info(`server listening on localhost:${this.wss.options.port}...`);
    this.pendingClosedown = undefined;
    this._setup();
  }

  _setup() {
    this.wss.on('connection', (ws) => {
      let sessionId;
      let role;
      ws.on('message', (str) => {
        try {
          const action = JSON.parse(str);
          if (!action.type) {
            return;
          }
          if (action.type === 'login') {
            if (action.params && action.params.sessionId && action.params.role) {
              sessionId = action.params.sessionId;
              role = action.params.role;
              this.log.debug({ event: 'LOGIN' }, `role=${role}, sessionId=${sessionId}`);
              _.set(this.sessions, [sessionId, role], ws);
              action.type = 'loginSuccess';
              this.sendAction(ws, action);
              this.log.debug({ event: 'LOGIN_SUCCESS' }, `role=${role}, sessionId=${sessionId}`);
            }
          } else if (sessionId && role) {
            this.log.trace({ event: 'MESSAGE', action: action.type }, `role=${role} action=${action.type} (sessionId=${sessionId})`);
            this.sendToOtherRole(sessionId, role, action);
          }
        } catch (err) {
          this.log.debug({ event: 'ERROR', err }, `Invalid JSON received, cannot parse`, err);
        }
      });

      ws.on('close', () => {
        if (sessionId && role) {
          this.log.debug({ event: 'DISCONNECT' }, `role=${role}, sessionId=${sessionId}`);

          if (this.standalone && role === ROLE_TESTER) {
            this.sendToOtherRole(sessionId, role, { type: 'testerDisconnected', messageId: -1 });
          }

          _.set(this.sessions, [sessionId, role], undefined);

          this._resolvePendingClosedownIfNeeded();
        }
      });
    });
  }

  sendAction(ws, action) {
    ws.send(JSON.stringify(action) + '\n ');
  }

  sendToOtherRole(sessionId, role, action) {
    const otherRole = role === ROLE_TESTEE ? ROLE_TESTER : ROLE_TESTEE;
    const ws = _.get(this.sessions, [sessionId, otherRole]);
    if (ws && ws.readyState === WebSocket.OPEN) {
      this.sendAction(ws, action);
    } else {
      this.log.debug({ event: 'CANNOT_FORWARD' }, `role=${otherRole} not connected, cannot fw action (sessionId=${sessionId})`);
    }
  }

  async close() {
    if (this._hasConnections()) {
      await this._closeWithTimeout();
    } else {
      this.wss.close();
    }
  }

  async _closeWithTimeout() {
    this.pendingClosedown = delegatedPromise();

    const handle = setTimeout(() => {
      this.log.warn({ event: 'TIMEOUT' }, 'Detox server closed ungracefully on a timeout!!!');
      this._resolvePendingClosedown();
    }, CLOSE_TIMEOUT);

    this.wss.close();
    await this.pendingClosedown;
    clearTimeout(handle);
  }

  _resolvePendingClosedownIfNeeded() {
    if (this._isClosedownPending() && !this._hasConnections()) {
      this._resolvePendingClosedown();
    }
  }

  _isClosedownPending() {
    return !!this.pendingClosedown;
  }

  _resolvePendingClosedown() {
    this.pendingClosedown.resolve();
    this.pendingClosedown = undefined;
  }

  _hasConnections() {
    let result = false;
    _.forEach(this.sessions, (session) => {
      _.forEach(session, (role) => {
        if (role) {
          result = true;
        }
      });
    });
    return result;
  }
}

module.exports = DetoxServer;
