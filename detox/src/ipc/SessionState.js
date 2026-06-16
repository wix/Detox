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
    return cycle.stringify(SessionState._preprocessRegExps(this), SessionState._stringifier);
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
    if (typeof val === 'object' && val !== null) {
      if (typeof val.$fn == 'string') {
        return vm.runInContext(val.$fn, context);
      }
      if (typeof val.$regexp == 'object' && val.$regexp !== null) {
        return new RegExp(val.$regexp.source, val.$regexp.flags);
      }
    }
    return val;
  }

  static _stringifier(key, val) {
    if (typeof val === 'function') {
      return { $fn: `(${val})` };
    }
    return val;
  }

  static _preprocessRegExps(value) {
    if (value instanceof RegExp) {
      return { $regexp: { source: value.source, flags: value.flags } };
    }
    if (Array.isArray(value)) {
      return value.map(SessionState._preprocessRegExps);
    }
    if (value !== null && typeof value === 'object') {
      const result = {};
      for (const key of Object.keys(value)) {
        result[key] = SessionState._preprocessRegExps(value[key]);
      }
      return result;
    }
    return value;
  }
}

module.exports = SessionState;
