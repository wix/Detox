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
    console.log('%s: cannot fw sessionId=%s since other role=%s not connected', now(), sessionId, otherRole);
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
          console.log('%s: login sessionId=%s role=%s', now(), sessionId, role);
          _.set(sessions, [sessionId, role], ws);
        }
      } else {
        if (sessionId && role) {
          console.log('%s: fw sessionId=%s action=%s from role=%s', now(), sessionId, action.type, role);
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
      console.log('%s: disconnect sessionId=%s role=%s', now(), sessionId, role);
      _.set(sessions, [sessionId, role], undefined);
    }
  });
});
