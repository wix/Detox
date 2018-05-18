class Recorder {
  constructor({ artifactsRegistry }) {
    this._artifactsRegistry = artifactsRegistry;
  }

  record() {
    const recording = this.createRecording();

    this._artifactsRegistry.registerArtifact(recording);
    return recording;
  }

  createRecording() { /* abstract */ }
}

module.exports = Recorder;
