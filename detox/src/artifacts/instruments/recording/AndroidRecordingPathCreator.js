const RecordingPathBuilder = require('./RecordingPathCreator');

class AndroidRecordingPathCreator extends RecordingPathBuilder {
  constructor(devicePathBuilder) {
    super();
    this.devicePathBuilder = devicePathBuilder;
  }

  createRecordingPath() {
    return this.devicePathBuilder.buildTemporaryArtifactPath('.dtxplain');
  }
}

module.exports = AndroidRecordingPathCreator;
