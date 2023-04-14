const WholeTestRecorderPlugin = require('../templates/plugin/WholeTestRecorderPlugin');

class VideoArtifactPlugin extends WholeTestRecorderPlugin {
  constructor({ api }) {
    super({ api });
  }

  async preparePathForTestArtifact(testSummary) {
    return this.api.preparePathForArtifact('test.mp4', testSummary);
  }

  /** @param {string} config */
  static parseConfig(config) {
    switch (config) {
      case 'failing':
        return {
          enabled: true,
          keepOnlyFailedTestsArtifacts: true,
        };
      case 'all':
        return {
          enabled: true,
          keepOnlyFailedTestsArtifacts: false,
        };
      case 'none':
      default:
        return {
          enabled: false,
          keepOnlyFailedTestsArtifacts: false,
        };
    }
  }
}

module.exports = VideoArtifactPlugin;
