#! /usr/bin/env node

var _ = require('lodash');

var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({ port: 8099 });

console.log('server listening on localhost:8099...');

var sessions = {};

function sendAction(ws, type, params) {
  ws.send(JSON.stringify({
    type: type,
    params: params
  }));
}

function sendToOtherRole(sessionId, role, type, params) {
  var otherRole = role === 'testee' ? 'tester' : 'testee';
  var ws = _.get(sessions, [sessionId, otherRole]);
  if (ws) {
    sendAction(ws, type, params);
  } else {
    console.log('cannot fw sessionId=%s since other role=%s not connected', sessionId, otherRole);
  }
}

wss.on('connection', function connection(ws) {
  var sessionId;
  var role;
  ws.on('message', function (str) {
    var action = JSON.parse(str);
    if (!action.type) return;
    if (action.type === 'login') {
      if (action.params && action.params.sessionId && action.params.role) {
        sessionId = action.params.sessionId;
        role = action.params.role;
        console.log('login sessionId=%s role=%s', sessionId, role);
        _.set(sessions, [sessionId, role], ws);
      }
    } else {
      if (sessionId && role) {
        console.log('fw sessionId=%s action=%s from role=%s', sessionId, action.type, role);
        sendToOtherRole(sessionId, role, action.type, action.params);
      }
    }
  });
  ws.on('close', function () {
    if (sessionId && role) {
      console.log('disconnect sessionId=%s role=%s', sessionId, role);
      _.set(sessions, [sessionId, role], undefined);
    }
  });
});
