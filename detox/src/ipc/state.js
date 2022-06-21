class SecondarySessionState {
  constructor({ detoxConfig = null, workersCount = 0 }) {
    this.detoxConfig = detoxConfig;
    this.workersCount = workersCount;
  }

  patch(state) {
    Object.assign(this, state);
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
  PrimarySessionState,
  SecondarySessionState,
};
