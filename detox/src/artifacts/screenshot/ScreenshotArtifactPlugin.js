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

  async onAfterEach(testSummary) {
    await super.onAfterEach(testSummary);

    for (const name of Object.keys(this.snapshots)) {
      this.startSavingSnapshot(testSummary, name);
      delete this.snapshots[name];
    }
  }

  async preparePathForSnapshot(testSummary, name) {
    return this.api.preparePathForArtifact(`${name}.png`, testSummary);
  }

  async onUserAction({ type, options }) {
    switch (type) {
      case 'takeScreenshot':
        return this._takeScreenshot(options);
    }
  }

  async _takeScreenshot({ name }) {
    const screenshot = await this.takeSnapshot();
    this.snapshots[name] = screenshot;
    this.api.trackArtifact(screenshot);
  }
}

module.exports = ScreenshotArtifactPlugin;
