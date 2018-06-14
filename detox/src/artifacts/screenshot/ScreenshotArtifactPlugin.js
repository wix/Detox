const argparse = require('../../utils/argparse');
const TwoSnapshotsPerTestPlugin = require('../templates/plugin/TwoSnapshotsPerTestPlugin');

/***
 * @abstract
 */
class ScreenshotArtifactPlugin extends TwoSnapshotsPerTestPlugin {
  constructor(config) {
    super(config);

    const takeScreenshots = argparse.getArgValue('take-screenshots');

    this.enabled = takeScreenshots && takeScreenshots !== 'none';
    this.keepOnlyFailedTestsArtifacts = takeScreenshots === 'failing';
  }

  async preparePathForSnapshot(testSummary, index) {
    const pngName = index === 0 ? 'beforeEach.png' : 'afterEach.png';
    return this.api.preparePathForArtifact(pngName, testSummary);
  }
}

module.exports = ScreenshotArtifactPlugin;