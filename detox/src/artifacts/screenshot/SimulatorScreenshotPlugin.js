const _ = require('lodash');
const fs = require('fs-extra');
const log = require('npmlog');
const tempfile = require('tempfile');
const Artifact = require('../templates/artifact/Artifact');
const ScreenshotArtifactPlugin = require('./ScreenshotArtifactPlugin');

class SimulatorScreenshotter extends ScreenshotArtifactPlugin {
  constructor(config) {
    super(config);

    this.appleSimUtils = config.appleSimUtils;
  }

  async onBeforeLaunchApp() {
    await this._takeEmptyScreenshotToPreventFirstTimeErrorInRealScreenshots();
  }

  async onResetDevice() {
    await this._takeEmptyScreenshotToPreventFirstTimeErrorInRealScreenshots();
  }

  async _takeEmptyScreenshotToPreventFirstTimeErrorInRealScreenshots() {
    const udid = this.api.getDeviceId();
    await this.appleSimUtils.takeScreenshot(udid, '/dev/null').catch(_.noop);
  }

  createTestArtifact() {
    const { api, appleSimUtils } = this;
    const temporaryFilePath = tempfile('.png');

    return new Artifact({
      async start() {
        await appleSimUtils.takeScreenshot(api.getDeviceId(), temporaryFilePath);
      },

      async save(artifactPath) {
        log.verbose('SimulatorScreenshotter', 'moving file (%s) to: %s', temporaryFilePath, artifactPath);
        await fs.move(temporaryFilePath, artifactPath);
      },

      async discard() {
        log.verbose('SimulatorScreenshotter', 'removing temp file: %s', temporaryFilePath);
        await fs.remove(temporaryFilePath);
      },
    });
  }
}

module.exports = SimulatorScreenshotter;
