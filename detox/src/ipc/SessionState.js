class SessionState {
  constructor({ detoxConfig = null, workersCount = 0 }) {
    this.detoxConfig = detoxConfig;
    this.workersCount = workersCount;
  }

  patch(state) {
    Object.assign(this, state);
  }
}

module.exports = SessionState;
