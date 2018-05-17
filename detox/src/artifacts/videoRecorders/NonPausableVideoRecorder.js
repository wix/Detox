const path = require('path');
const NonPausableVideoRecording = require('./NonPausableVideoRecording');

class NonPausableVideoRecorder {
  constructor({
    artifactsRootDir,
    recorder,
  }) {
    this.artifactsRootDir = path.resolve(artifactsRootDir);
    this.recorder = recorder;
  }

  recordVideo(artifactPath) {
    const recording = this.recorder.recordVideo(artifactPath);
    return new NonPausableVideoRecording(recording);
  }
}


module.exports = NonPausableVideoRecorder;