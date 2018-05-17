class NoopScreenshotHandle {
  async save() {}
  async discard() {}
}

class NoopScreenshotter {
  async takeScreenshot() {
    return new NoopScreenshotHandle();
  }
}

module.exports = NoopScreenshotter;