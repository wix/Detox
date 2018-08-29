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

  async onUserAction({ type, options }) {
    if (type === 'takeScreenshot') {
      return this._takeScreenshot(options);
    }
  }

  async _takeScreenshot({ name }) {
    const screenshot = await this.takeSnapshot();
    const artifactPathPromise = this.api.preparePathForArtifact(`${name}.png`, this.context.testSummary);
    this.api.requestIdleCallback(async () => screenshot.save(await artifactPathPromise), '_takeScreenshot');

    return artifactPathPromise;
  }
}

module.exports = ScreenshotArtifactPlugin;