class FakeClient {
  constructor(...args) {
    this.lastConstructorArguments = args;
    this.setNonresponsivenessListener = jest.fn();
    this.getPendingCrashAndReset = jest.fn();
    this.dumpPendingRequests = jest.fn();
  }
}

module.exports = FakeClient;