const log = require('npmlog');
const WebSocket = require('ws');
const _ = require('lodash');
const Queue = require('./commons/dataStructures').Queue;

let _detoxConfig = {};
let _ws;

const _invokeQueue = new Queue();
let invocationId = 0;
let _onTestResult;
const _onNextAction = {};

function sendAction(type, params) {
  const json = JSON.stringify({
    type: type,
    params: params
  }) + '\n ';
  _ws.send(json);
  log.silly(`ws sendAction (tester):`, `${json.trim()}`);
}

function config(params) {
  _detoxConfig = params;
}

function connect(onConnect) {
  _ws = new WebSocket(_detoxConfig.server);

  _ws.on('open', () => {
    sendAction('login', {
      sessionId: _detoxConfig.sessionId,
      role: 'tester'
    });
    onConnect();
  });

  _ws.on('message', (str) => {
    const action = JSON.parse(str);
    if (!action.type) {
      log.error(`ws received malformed action from testee:`, str, `action must have a type`);
    }
    handleAction(action.type, action.params);
    log.silly(`ws handleAction (tester):`, `${str.trim()}`);
  });
}

function cleanup(onComplete) {
  waitForAction('cleanupDone', onComplete);
  if (_ws.readyState === WebSocket.OPEN) {
    sendAction('cleanup');
  } else {
    onComplete();
  }
}

function execute(invocation) {
  if (typeof invocation === 'function') {
    invocation = invocation();
  }

  const id = invocationId++;
  invocation.id = id.toString();
  _invokeQueue.enqueue(invocation);
  if (_invokeQueue.length() === 1) {
    sendAction('invoke', _invokeQueue.peek());
  }
}

function waitForTestResult(done) {
  if (typeof done !== 'function') {
    throw new Error(`must pass a 'done' parameter of type 'function' to detox.waitForTestResult(done)`);
  }
  _onTestResult = done;
}

function waitForAction(type, done) {
  _onNextAction[type] = done;
}

function handleAction(type, params) {
  if (typeof _onNextAction[type] === 'function') {
    _onNextAction[type]();
    _onNextAction[type] = undefined;
  }

  switch (type) {
    case 'testFailed':
      _onTestResult(new Error(params.details));
      _onTestResult = undefined;
      break;
    case 'error':
      log.error(params.error);
      break;
    case 'invokeResult':
      _invokeQueue.dequeue();

      if (_invokeQueue.peek()) {
        sendAction('invoke', _invokeQueue.peek());
      }

      if (_invokeQueue.isEmpty()) {
        _onTestResult();
        _onTestResult = undefined;
      }

      break;
    default:
      break;
  }
}

// if there's an error thrown, close the websocket,
// if not, mocha will continue running until reaches timeout.
process.on('uncaughtException', (err) => {
  if (_ws) {
    _ws.close();
  }

  throw err;
});

process.on('unhandledRejection', (reason, p) => {
  if (_ws) {
    _ws.close();
  }

  throw reason;
});

module.exports = {
  config,
  connect,
  cleanup,
  waitForTestResult,
  waitForAction,
  execute,
  sendAction
};
