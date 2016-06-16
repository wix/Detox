var WebSocket = require('ws');

var _detoxConfig = {
  server: 'ws://localhost:8099',
  sessionId: 'example'
};
var _ws;
var _invokeQueue = [];
var _readyForInvokeId = 0;
var _finishOnInvokeId;

function sendAction(type, params) {
  if (!_ws) return;
  _ws.send(JSON.stringify({
    type: type,
    params: params
  }));
}

function config(params) {
  _detoxConfig = params;
}

function connect(onConnect) {
  _ws = new WebSocket(_detoxConfig.server);
  _ws.on('open', function () {
    sendAction('login', {
      sessionId: _detoxConfig.sessionId,
      role: 'tester'
    });
    onConnect();
  });
  _ws.on('message', function (str) {
    var action = JSON.parse(str);
    if (!action.type) return;
    handleAction(action.type, action.params);
  });
}

function invoke(params) {
  var id = _invokeQueue.length;
  params.id = id.toString();
  _invokeQueue.push(params);
  if (_readyForInvokeId >= id) {
    sendAction('invoke', params);
  }
}

function done() {
  _finishOnInvokeId = _invokeQueue.length;
}

function handleAction(type, params) {
  if (type === 'testFailed') {
    console.log('Test Failed:\n%s', params.details);
    process.exit(0);
  }
  if (type === 'error') {
    console.log('error: %s', params.error);
  }
  if (type === 'invokeResult') {
    // console.log('invokeResult: %s %s', params.id, params.result);
    console.log('.');
    _readyForInvokeId++;
    if (_invokeQueue[_readyForInvokeId]) {
      sendAction('invoke', _invokeQueue[_readyForInvokeId]);
    }
    if (_finishOnInvokeId === _readyForInvokeId) {
      console.log('Test Passed');
      process.exit(0);
    }
  }
}

module.exports = {
  config: config,
  connect: connect,
  invoke: invoke,
  done: done
};
