const argparse = require('../../utils/argparse');
const WholeTestRecorderPlugin = require('../templates/plugin/WholeTestRecorderPlugin');

class VideoArtifactPlugin extends WholeTestRecorderPlugin {
  constructor(config) {
    super(config);

    const recordVideos = argparse.getArgValue('record-videos');

    this.enabled = recordVideos && recordVideos !== 'none';
    this.keepOnlyFailedTestsArtifacts = recordVideos === 'failing';
  }

  async preparePathForTestArtifact(testSummary) {
    return this.api.preparePathForArtifact('test.mp4', testSummary);
  }
}

module.exports = VideoArtifactPlugin;
