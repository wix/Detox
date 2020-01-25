const TwoSnapshotsPerTestPlugin = require('../templates/plugin/TwoSnapshotsPerTestPlugin');

/***
 * @abstract
 */
class ScreenshotArtifactPlugin extends TwoSnapshotsPerTestPlugin {
  constructor({ api }) {
    super({ api });
  }

  async preparePathForSnapshot(testSummary, name) {
    return this.api.preparePathForArtifact(`${name}.png`, testSummary);
  }

  static parseConfig(config) {
    switch (config) {
      case 'failing':
        return {
          enabled: true,
          shouldTakeAutomaticSnapshots: true,
          keepOnlyFailedTestsArtifacts: true,
        };
      case 'all':
        return {
          enabled: true,
          shouldTakeAutomaticSnapshots: true,
          keepOnlyFailedTestsArtifacts: false,
        };
      case 'none':
        return {
          enabled: false,
          shouldTakeAutomaticSnapshots: false,
          keepOnlyFailedTestsArtifacts: false,
        };
      case 'manual':
      default:
        return {
          enabled: true,
          shouldTakeAutomaticSnapshots: false,
          keepOnlyFailedTestsArtifacts: false,
        };
    }
  }
}

module.exports = ScreenshotArtifactPlugin;
