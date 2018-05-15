class NoopLogTailRecording {
  async start() {}
  async stop() {}
  async save() {}
  async discard() {}
}

class NoopLogger {
  recordLog() {
    return new NoopLogTailRecording();
  }
}

module.exports = NoopLogger;