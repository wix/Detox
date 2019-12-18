const temporaryPath = require('../../utils/temporaryPath');
const RecordingPathBuilder = require('./RecordingPathCreator');

class IosRecordingPathCreator extends RecordingPathBuilder {
  createRecordingPath() {
    return temporaryPath.for.dtxrec();
  }
}

module.exports = IosRecordingPathCreator;
