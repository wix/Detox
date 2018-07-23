const _ = require('lodash');
const WebSocketServer = require('ws').Server;
const log = require('detox-common').logger.server.child({ __filename });

class DetoxServer {
  constructor(port) {
    this.wss = new WebSocketServer({ port });
    this.sessions = {};

    log.info(`server listening on localhost:${this.wss.options.port}...`);
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
              log.debug({ event: 'LOGIN' }, `role=${role}, sessionId=${sessionId}`);
              _.set(this.sessions, [sessionId, role], ws);
              action.type = 'loginSuccess';
              this.sendAction(ws, action);
              log.debug({ event: 'LOGIN_SUCCESS' }, `role=${role}, sessionId=${sessionId}`);
            }
          } else if (sessionId && role) {
            log.trace({ event: 'MESSAGE', action: action.type }, `role=${role} action=${action.type} (sessionId=${sessionId})`);
            this.sendToOtherRole(sessionId, role, action);
          }
        } catch (err) {
          log.debug({ event: 'ERROR', err }, `Invalid JSON received, cannot parse`, err);
        }
      });

      ws.on('close', () => {
        if (sessionId && role) {
          log.debug({ event: 'DISCONNECT' }, `role=${role}, sessionId=${sessionId}`);
          _.set(this.sessions, [sessionId, role], undefined);
        }
      });
    });
  }

  sendAction(ws, action) {
    ws.send(JSON.stringify(
      action
    ) + '\n ');
  }

  sendToOtherRole(sessionId, role, action) {
    const otherRole = role === 'testee' ? 'tester' : 'testee';
    const ws = _.get(this.sessions, [sessionId, otherRole]);
    if (ws) {
      this.sendAction(ws, action);
    } else {
      log.debug({ event: 'CANNOT_FORWARD' }, `role=${otherRole} not connected, cannot fw action (sessionId=${sessionId})`);
    }
  }

  close() {
    this.wss.close();
  }
}

module.exports = DetoxServer;
