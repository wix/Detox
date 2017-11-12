const log = require('npmlog');
const _ = require('lodash');
const WebSocketServer = require('ws').Server;

log.addLevel('wss', 999, {fg: 'blue', bg: 'black'}, 'wss');
log.heading = 'detox-server';
log.loglevel = 'wss';

class DetoxServer {
  constructor(port) {
    this.wss = new WebSocketServer({port: port});
    this.sessions = {};

    log.log('info', `${now()}:`, `server listening on localhost:${this.wss.options.port}...`);
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
              log.log('wss', `${now()}:`, `role=${role} login (sessionId=${sessionId})`);
              _.set(this.sessions, [sessionId, role], ws);
              action.type = 'loginSuccess';
              this.sendAction(ws, action);
              log.log('wss', `${now()}:`, `role=${role} action=${action.type} (sessionId=${sessionId})`);
            }
          } else if (sessionId && role) {
            log.log('wss', `${now()}:`, `role=${role} action=${action.type} (sessionId=${sessionId})`);
            this.sendToOtherRole(sessionId, role, action);
          }
        } catch (error) {
          log.log('wss', `Invalid JSON received, cannot parse`, error);
        }
      });

      ws.on('close', () => {
        if (sessionId && role) {
          log.log('wss', `${now()}:`, `role=${role} disconnect (sessionId=${sessionId})`);
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
      log.log('wss', `${now()}:`, `role=${otherRole} not connected, cannot fw action (sessionId=${sessionId})`);
    }
  }

  close() {
    this.wss.close();
  }
}

function now() {
  return new Date().toTimeString().slice(0, 8);
}

module.exports = DetoxServer;
