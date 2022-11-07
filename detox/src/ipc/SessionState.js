const cycle = require('json-cycle');

class SessionState {
  constructor({
    id = '',
    contexts = [],
    detoxConfig = null,
    detoxIPCServer = '',
    testResults = [],
    testSessionIndex = 0,
    workersCount = 0
  }) {
    this.id = id;
    this.contexts = contexts;
    this.detoxConfig = detoxConfig;
    this.detoxIPCServer = detoxIPCServer;
    this.testResults = testResults;
    this.testSessionIndex = testSessionIndex;
    this.workersCount = workersCount;
  }

  patch(state) {
    Object.assign(this, state);
  }

  stringify() {
    return cycle.stringify(this, SessionState.stringifier);
  }

  /**
   * @return {*}
   */
  static parse(stringified) {
    const Class = this; // eslint-disable-line unicorn/no-this-assignment
    // @ts-ignore
    return new Class(cycle.parse(stringified, SessionState.reviver));
  }

  static reviver(key, val) {
    if (typeof val === 'object' && val !== null && typeof val.$fn == 'string') {
      return eval(val.$fn);
    } else {
      return val;
    }
  }

  static stringifier(key, val) {
    if (typeof val === 'function') {
      return { $fn: `(${val})` };
    } else {
      return val;
    }
  }
}

module.exports = SessionState;
