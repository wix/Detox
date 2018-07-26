const _ = require('lodash');
const fs = require('fs-extra');
const log = require('../../utils/logger').child({ __filename });
const tempfile = require('tempfile');
const Artifact = require('../templates/artifact/Artifact');
const ScreenshotArtifactPlugin = require('./ScreenshotArtifactPlugin');

class SimulatorScreenshotter extends ScreenshotArtifactPlugin {
  constructor(config) {
    super(config);

    this.appleSimUtils = config.appleSimUtils;
  }

  async onBootDevice(event) {
    super.onBootDevice(event);

    if (this.enabled && event.coldBoot) {
      // NOTE: the line below is supposed to prevent an error, which tends to occur
      // when you take a screenshot for the first time on iOS Simulator running
      // in a hidden window mode or on CI. This is why we don't write the screenshot
      // anywhere and ignore an error.

      await this.appleSimUtils.takeScreenshot(event.deviceId, '/dev/null').catch(_.noop);
    }
  }

  createTestArtifact() {
    const { context, appleSimUtils } = this;
    const temporaryFilePath = tempfile('.png');

    return new Artifact({
      name: 'SimulatorScreenshot',

      async start() {
        await appleSimUtils.takeScreenshot(context.deviceId, temporaryFilePath);
      },

      async save(artifactPath) {
        log.debug({ event: 'MOVE_FILE' }, `moving file "${temporaryFilePath}" to "${artifactPath}"`);
        await fs.move(temporaryFilePath, artifactPath);
      },

      async discard() {
        log.debug({ event: 'REMOVE_FILE' }, `removing temp file: ${temporaryFilePath}`);
        await fs.remove(temporaryFilePath);
      },
    });
  }
}

module.exports = SimulatorScreenshotter;
