const _ = require('lodash');
const WebSocketServer = require('ws').Server;

class DetoxServer {
  constructor(port) {
    this.wss = new WebSocketServer({port: port});
    this.sessions = {};

    console.log(`${now()}: server listening on localhost:${this.wss.options.port}...`);
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
              console.log(`${now()}: role=${role} login (sessionId=${sessionId})`);
              _.set(this.sessions, [sessionId, role], ws);
            }
          } else if (sessionId && role) {
            console.log(`${now()}: role=${role} action=${action.type} (sessionId=${sessionId})`);
            this.sendToOtherRole(sessionId, role, action.type, action.params);
          }
        } catch (error) {
          console.log(`Invalid JSON received, cannot parse`);
        }
      });

      ws.on('close', () => {
        if (sessionId && role) {
          console.log(`${now()}: role=${role} disconnect (sessionId=${sessionId})`);
          _.set(this.sessions, [sessionId, role], undefined);
        }
      });
    });
  }

  sendAction(ws, type, params) {
    ws.send(JSON.stringify({
      type: type,
      params: params
    }) + '\n ');
  }

  sendToOtherRole(sessionId, role, type, params) {
    const otherRole = role === 'testee' ? 'tester' : 'testee';
    const ws = _.get(this.sessions, [sessionId, otherRole]);
    if (ws) {
      this.sendAction(ws, type, params);
    } else {
      console.log(`${now()}: role=${otherRole} not connected, cannot fw action (sessionId=${sessionId})`);
    }
  }
}

function now() {
  return new Date().toTimeString().slice(0, 8);
}

module.exports = DetoxServer;
