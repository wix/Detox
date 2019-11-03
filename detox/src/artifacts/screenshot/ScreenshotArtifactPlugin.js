const _ = require('lodash');
const argparse = require('../../utils/argparse');
const log = require('../../utils/logger').child({ __filename });
const TwoSnapshotsPerTestPlugin = require('../templates/plugin/TwoSnapshotsPerTestPlugin');

/***
 * @abstract
 */
class ScreenshotArtifactPlugin extends TwoSnapshotsPerTestPlugin {
  constructor(config) {
    super(config);

    const takeScreenshots = argparse.getArgValue('take-screenshots');

    this.enabled = !takeScreenshots || takeScreenshots !== 'none';
    this.shouldTakeAutomaticSnapshots = takeScreenshots === 'failing' || takeScreenshots === 'all';
    this.keepOnlyFailedTestsArtifacts = takeScreenshots === 'failing';
  }

  async preparePathForSnapshot(testSummary, name) {
    return this.api.preparePathForArtifact(`${name}.png`, testSummary);
  }
}

module.exports = ScreenshotArtifactPlugin;
