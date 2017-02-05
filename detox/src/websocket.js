const log = require('npmlog');
const WebSocket = require('ws');
const _ = require('lodash');
const Queue = require('./commons/dataStructures').Queue;

class WebsocketClient {

  constructor(config) {
    this.configuration = config;
    this.ws = undefined;
    this.invokeQueue = new Queue();
    this.invocationId = 0;
    this.onTestResult = undefined;
    this.onNextAction = {};
  }

  sendAction(type, params) {
    const json = JSON.stringify({
      type: type,
      params: params
    }) + '\n ';
    this.ws.send(json);
    log.silly(`ws sendAction (tester):`, `${json.trim()}`);
  }

  connect(done) {
    this.ws = new WebSocket(this.configuration.server);
    this.ws.on('open', () => {
      this._onOpen(done);
    });

    this.ws.on('message', (str) => {
      this._onMessage(str);
    });
  }

  _onOpen(done) {
    this.sendAction('login', {
      sessionId: this.configuration.sessionId,
      role: 'tester'
    });
    done();
  }

  _onMessage(str) {
    const action = JSON.parse(str);
    if (!action.type) {
      log.error(`ws received malformed action from testee:`, str, `action must have a type`);
    }
    this.handleAction(action.type, action.params);
    log.silly(`ws handleAction (tester):`, `${str.trim()}`);
  }

  cleanup(done) {
    this.waitForAction('cleanupDone', done);
    console.log(this.ws.readyState)
    if (this.ws.readyState === WebSocket.OPEN) {
      this.sendAction('cleanup');
    } else {
      done();
    }
  }

  execute(invocation) {
    if (typeof invocation === 'function') {
      invocation = invocation();
    }

    const id = this.invocationId++;
    invocation.id = id.toString();
    this.invokeQueue.enqueue(invocation);
    if (this.invokeQueue.length() === 1) {
      this.sendAction('invoke', this.invokeQueue.peek());
    }
  }

  waitForTestResult(done) {
    if (typeof done !== 'function') {
      throw new Error(`must pass a 'done' parameter of type 'function' to detox.waitForTestResult(done)`);
    }
    this.onTestResult = done;
  }

  waitForAction(type, done) {
    this.onNextAction[type] = done;
  }

  handleAction(type, params) {
    if (typeof this.onNextAction[type] === 'function') {
      this.onNextAction[type]();
      this.onNextAction[type] = undefined;
    }

    switch (type) {
      case 'testFailed':
        this.onTestResult(new Error(params.details));
        this.onTestResult = undefined;
        break;
      case 'error':
        log.error(params.error);
        break;
      case 'invokeResult':
        this.invokeQueue.dequeue();

        if (this.invokeQueue.peek()) {
          this.sendAction('invoke', this.invokeQueue.peek());
        }

        if (this.invokeQueue.isEmpty()) {
          this.onTestResult();
          this.onTestResult = undefined;
        }
        break;
      default:
        break;
    }
  }

  close() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

module.exports = WebsocketClient;
