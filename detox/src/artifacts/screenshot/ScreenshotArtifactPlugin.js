const _ = require('lodash');

const TwoSnapshotsPerTestPlugin = require('../templates/plugin/TwoSnapshotsPerTestPlugin');

/***
 * @abstract
 */
class ScreenshotArtifactPlugin extends TwoSnapshotsPerTestPlugin {
  constructor({ api }) {
    super({ api });

    _.defaults(this.takeAutomaticSnapshots, {
      appNotReady: true,
    });
  }

  async preparePathForSnapshot(testSummary, name) {
    const artifactName = name.endsWith('.png') ? name : `${name}.png`;
    return this.api.preparePathForArtifact(artifactName, testSummary);
  }

  async onBeforeCleanup(e) {
    if (this.context.isAppReady === false) {
      this._hasFailingTests = true;
      await this._takeAutomaticSnapshot('appNotReady');
    }

    await super.onBeforeCleanup(e);
  }

  /** @param {string} config */
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
