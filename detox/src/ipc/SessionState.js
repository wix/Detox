const vm = require('vm');

const cycle = require('json-cycle');

const context = vm.createContext({ require }, {
  name: 'VM User Context',
});

class SessionState {
  constructor({
    id = '',
    detoxConfig = null,
    detoxIPCServer = '',
    testResults = [],
    testSessionIndex = 0,
    workersCount = 0
  }) {
    this.id = id;
    this.detoxConfig = detoxConfig;
    this.detoxIPCServer = detoxIPCServer;
    this.testResults = testResults;
    this.testSessionIndex = testSessionIndex;
    this.unsafe_earlyTeardown = undefined;
    this.workersCount = workersCount;
  }

  patch(state) {
    Object.assign(this, state);
  }

  stringify() {
    return cycle.stringify(this, SessionState._stringifier);
  }

  /**
   * @return {*}
   */
  static parse(stringified) {
    const Class = this; // eslint-disable-line unicorn/no-this-assignment
    // @ts-ignore
    return new Class(cycle.parse(stringified, SessionState._reviver));
  }

  static _reviver(key, val) {
    if (typeof val === 'object' && val !== null && typeof val.$fn == 'string') {
      return vm.runInContext(val.$fn, context);
    } else {
      return val;
    }
  }

  static _stringifier(key, val) {
    if (typeof val === 'function') {
      return { $fn: `(${val})` };
    } else {
      return val;
    }
  }
}

module.exports = SessionState;
