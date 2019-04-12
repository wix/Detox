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

  async onBeforeEach(testSummary) {
    this.context.testSummary = null;
    await this._flushScreenshots();

    await super.onBeforeEach(testSummary);
  }

  async onAfterEach(testSummary) {
    await super.onAfterEach(testSummary);
    await this._flushScreenshots();
  }

  async onAfterAll() {
    await super.onAfterAll();
    await this._flushScreenshots();
  }

  async preparePathForSnapshot(testSummary, name) {
    return this.api.preparePathForArtifact(`${name}.png`, testSummary);
  }

  async onUserAction({ type, options }) {
    switch (type) {
      case 'takeScreenshot':
        return this.takeSnapshot(options.name);
    }
  }

  async _flushScreenshots() {
    for (const name of Object.keys(this.snapshots)) {
      this.startSavingSnapshot(name);
      delete this.snapshots[name];
    }
  }
}

module.exports = ScreenshotArtifactPlugin;
