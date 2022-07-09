const cycle = require('json-cycle');

const uuid = require('../utils/uuid');

class SessionState {
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
    if (typeof val === 'object' && typeof val.$fn == 'string') {
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

class SecondarySessionState extends SessionState {
  constructor({ id = uuid.UUID(), detoxConfigSnapshotPath = '', detoxConfig = null, detoxIPCServer = '', workerId = undefined, workersCount = 0 }) {
    super();

    this.id = id;
    this.detoxConfigSnapshotPath = detoxConfigSnapshotPath;
    this.detoxConfig = detoxConfig;
    this.detoxIPCServer = detoxIPCServer;
    this.workerId = workerId;
    this.workersCount = workersCount;
  }
}

class PrimarySessionState extends SecondarySessionState {
  constructor({ contexts = [], failedTestFiles = [], logFiles = [], ...baseOpts }) {
    super(baseOpts);

    this.contexts = contexts;
    this.failedTestFiles = failedTestFiles;
    this.logFiles = logFiles;
  }
}

module.exports = {
  SessionState,
  PrimarySessionState,
  SecondarySessionState,
};
