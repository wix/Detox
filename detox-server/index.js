#! /usr/bin/env node

function now() {
  return new Date().toTimeString().slice(0,8);
}

var _ = require('lodash');

var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({ port: 8099 });

console.log('%s: server listening on localhost:8099...', now());

var sessions = {};

function sendAction(ws, type, params) {
  ws.send(JSON.stringify({
    type: type,
    params: params
  }) + '\n ');
}

function sendToOtherRole(sessionId, role, type, params) {
  var otherRole = role === 'testee' ? 'tester' : 'testee';
  var ws = _.get(sessions, [sessionId, otherRole]);
  if (ws) {
    sendAction(ws, type, params);
  } else {
    console.log('%s: role=%s not connected, cannot fw action (sessionId=%s)', now(), otherRole, sessionId);
  }
}

wss.on('connection', function connection(ws) {
  var sessionId;
  var role;
  ws.on('message', function (str) {
    try {
      var action = JSON.parse(str);
      if (!action.type) return;
      if (action.type === 'login') {
        if (action.params && action.params.sessionId && action.params.role) {
          sessionId = action.params.sessionId;
          role = action.params.role;
          console.log('%s: role=%s login (sessionId=%s)', now(), role, sessionId);
          _.set(sessions, [sessionId, role], ws);
        }
      } else {
        if (sessionId && role) {
          console.log('%s: role=%s action=%s (sessionId=%s)', now(), role, action.type, sessionId);
          sendToOtherRole(sessionId, role, action.type, action.params);
        }
      }
    }
    catch (error) {
      console.log("Invalid JSON received, cannot parse")
    }

  });
  ws.on('close', function () {
    if (sessionId && role) {
      console.log('%s: role=%s disconnect (sessionId=%s)', now(), role, sessionId);
      _.set(sessions, [sessionId, role], undefined);
    }
  });
});
