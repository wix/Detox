class ArtifactsApiMock {
  constructor() {
    this.preparePathForArtifact = jest.fn();
    this.trackArtifact = jest.fn();
    this.untrackArtifact = jest.fn();
    this.requestIdleCallback = jest.fn();
  }

  async emulateRunningAllIdleCallbacks() {
    for (const [callback] of this.requestIdleCallback.mock.calls) {
      await callback();
    }
  }
}

module.exports = ArtifactsApiMock;
