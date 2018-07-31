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
    await super.onBootDevice(event);

    if (this.enabled && event.coldBoot) {
      await this.appleSimUtils.takeScreenshot(event.deviceId, '/dev/null').catch(() => {
        log.debug({}, `
          NOTE: For an unknown reason, when you boot an iOS Simulator in a
          hidden window mode (or on CI), the first screenshot always fails.
          That's why we don't write the first screenshot to the filesystem and
          suppress the error in logs (except for debugging log levels). It is a
          dummy screenshot to ensure that the further ones are going to work fine.
        `.trim());
      });
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
