class Recorder {
  constructor({ artifactsRegistry }) {
    this.artifactsRegistry = artifactsRegistry;
  }

  record() {
    const recording = this.createRecording();

    this.artifactsRegistry.registerArtifact(recording);
    return recording;
  }

  createRecording() { /* abstract */ }
}

module.exports = Recorder;
