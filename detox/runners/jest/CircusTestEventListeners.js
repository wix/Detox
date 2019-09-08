const _ = require('lodash');

class CircusTestEventListeners {
  constructor() {
    this._listeners = [];
  }

  addListener(listener) {
    this._listeners.push(listener);
  }

  async notifyAll(event, state) {
    for (const listener of this._listeners) {
      await listener.handleTestEvent(event, state);
    }
  }
}

class TestEventListenerBase {
  constructor() {
    this._onBeforeEach = this._onBeforeEach.bind(this);
    this._onBeforeAll = this._onBeforeAll.bind(this);
    this._onAfterEach = this._onAfterEach.bind(this);
    this._onAfterAll = this._onAfterAll.bind(this);
    this._onSuiteStart = this._onSuiteStart.bind(this);
    this._onSuiteEnd = this._onSuiteEnd.bind(this);
    this._onTestStart = this._onTestStart.bind(this);
    this._onTestComplete = this._onTestComplete.bind(this);
    this._onTestSkip = this._onTestSkip.bind(this);
    this._handleHookEvents = this._handleHookEvents.bind(this);
    this._onError = this._onError.bind(this);

    this._dispatchMap = {
      'run_describe_start': this._onSuiteStart,
      'run_describe_finish': this._onSuiteEnd,
      'test_start': this._onTestStart,
      'test_done': this._onTestComplete,
      'test_skip': this._onTestSkip,
      'hook_start': this._handleHookEvents,
      'hook_failure': _.noop, // For clarity
      'hook_success': _.noop, // For clarity
      'error': this._onError,
    };
  }

  async handleTestEvent(event, state) {
    const fn = this._dispatchMap[event.name] || _.noop;
    await fn(event, state);
  }

  async _handleHookEvents(event, state) {
    const { type } = event.hook;
    const fnName = '_on' + type.charAt(0).toUpperCase() + type.slice(1);
    const fn = this[fnName];
    await fn(event, state);
  }

  _onSuiteStart(event, state) {}
  _onSuiteEnd(event, state) {}
  _onTestStart(event, state) {}
  _onTestComplete(event, state) {}
  _onTestSkip(event, state) {}
  _onBeforeEach(event, state) {}
  _onAfterEach(event, state) {}
  _onBeforeAll(event, state) {}
  _onAfterAll(event, state) {}
  _onError(event, state) {}
}

module.exports = CircusTestEventListeners;
module.exports.TestEventListenerBase = TestEventListenerBase;
