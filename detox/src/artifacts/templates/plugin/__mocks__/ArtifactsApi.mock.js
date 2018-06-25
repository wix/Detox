class ArtifactsApiMock {
  constructor() {
    this.getDeviceId = jest.fn();
    this.getBundleId = jest.fn();
    this.getPid = jest.fn();
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
