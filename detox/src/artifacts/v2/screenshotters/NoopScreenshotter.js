class NoopScreenshotHandle {
  async save() {}
  async discard() {}
}

class NoopScreenshotter {
  takeScreenshot() {
    return new NoopScreenshotHandle();
  }
}

module.exports = NoopScreenshotter;