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
  constructor({
    id = uuid.UUID(),
    detoxConfigSnapshotPath = '',
    detoxConfig = null,
    detoxIPCServer = '',
    failedTestFiles = [],
    testFilesToRetry = [],
    testSessionIndex = 0,
    workerId = undefined,
    workersCount = 0
  }) {
    super();

    this.id = id;
    this.detoxConfigSnapshotPath = detoxConfigSnapshotPath;
    this.detoxConfig = detoxConfig;
    this.detoxIPCServer = detoxIPCServer;
    this.failedTestFiles = failedTestFiles;
    this.testFilesToRetry = testFilesToRetry;
    this.testSessionIndex = testSessionIndex;
    this.workerId = workerId;
    this.workersCount = workersCount;
  }
}

class PrimarySessionState extends SecondarySessionState {
  constructor({
    contexts = [],
    logFiles = [],
    failedTestFiles = [],
    testFilesToRetry = [],
    testSessionIndex = 0,
    ...baseOpts
  }) {
    super(baseOpts);

    this.contexts = contexts;
    this.failedTestFiles = failedTestFiles;
    this.logFiles = logFiles;
    this.testSessionIndex = testSessionIndex;
    this.testFilesToRetry = testFilesToRetry;
  }
}

module.exports = {
  SessionState,
  PrimarySessionState,
  SecondarySessionState,
};
