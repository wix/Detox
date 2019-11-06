const _ = require('lodash');
const log = require('../../utils/logger').child({ __filename });
const temporaryPath = require('../utils/temporaryPath');
const FileArtifact = require('../templates/artifact/FileArtifact');
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
          NOTE: For an unknown yet reason, taking the first screenshot is apt
          to fail when booting iOS Simulator in a hidden window mode (or on CI).
          Detox applies a workaround by taking a dummy screenshot to ensure
          that the future ones are going to work fine. This screenshot is not
          saved anywhere, and the error above is suppressed for all log levels
          except for "debug" and "trace."
        `.trim());
      });
    }
  }

  createTestArtifact() {
    const { context, appleSimUtils } = this;

    return new FileArtifact({
      name: 'SimulatorScreenshot',

      async start() {
        this.temporaryPath = temporaryPath.for.png();
        await appleSimUtils.takeScreenshot(context.deviceId, this.temporaryPath);
      },
    });
  }
}

module.exports = SimulatorScreenshotter;
