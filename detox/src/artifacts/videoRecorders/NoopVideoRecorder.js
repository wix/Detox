class NoopVideoRecording {
  async start() {}
  async stop() {}
  async save() {}
  async discard() {}
}

class NoopVideoRecorder {
  recordVideo() {
    return new NoopVideoRecording();
  }
}

module.exports = NoopVideoRecorder;