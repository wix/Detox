var WebSocket = require('ws');

var _detoxConfig = {
  server: 'ws://localhost:8099',
  sessionId: 'example'
};
var _ws;
var _invokeQueue = [];
var _readyForInvokeId = 0;
var _finishOnInvokeId;
var _onTestResult;
var _onNextAction = {};

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

function cleanup(onComplete) {
  waitForNextAction('cleanupDone', onComplete);
  sendAction('cleanup');
}

function execute(invocation) {
  if (typeof invocation === 'function') {
    invocation = invocation();
  }
  var id = _invokeQueue.length;
  invocation.id = id.toString();
  _invokeQueue.push(invocation);
  if (_readyForInvokeId >= id) {
    sendAction('invoke', invocation);
  }
}

function waitForTestResult(done) {
  _finishOnInvokeId = _invokeQueue.length;
  _onTestResult = done;
}

function waitForNextAction(type, done) {
  _onNextAction[type] = done;
}

function handleAction(type, params) {
  if (typeof _onNextAction[type] === 'function') {
    _onNextAction[type]();
    _onNextAction[type] = undefined;
  }
  if (type === 'testFailed') {
    // console.log('DETOX: Test Failed:\n%s', params.details);
    if (typeof _onTestResult === 'function') {
      _onTestResult(new Error(params.details));
      _onTestResult = undefined;
    } else {
      process.exit(0);
    }
  }
  if (type === 'error') {
    console.log('error: %s', params.error);
  }
  if (type === 'invokeResult') {
    // console.log('DETOX: invokeResult: %s %s', params.id, params.result);
    // console.log('DETOX: .');
    _readyForInvokeId++;
    if (_invokeQueue[_readyForInvokeId]) {
      sendAction('invoke', _invokeQueue[_readyForInvokeId]);
    }
    if (_finishOnInvokeId === _readyForInvokeId) {
      // console.log('DETOX: Test Passed');
      if (typeof _onTestResult === 'function') {
        _onTestResult();
        _onTestResult = undefined;
      } else {
        process.exit(0);
      }
    }
  }
}

module.exports = {
  config: config,
  connect: connect,
  cleanup: cleanup,
  waitForTestResult: waitForTestResult,
  waitForNextAction: waitForNextAction,
  execute: execute,
  sendAction: sendAction
};
