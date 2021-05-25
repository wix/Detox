const fs = require('fs-extra');
const _ = require('lodash');

const log = require('../../utils/logger').child({ __filename });
const FileArtifact = require('../templates/artifact/FileArtifact');
const temporaryPath = require('../utils/temporaryPath');

const ScreenshotArtifactPlugin = require('./ScreenshotArtifactPlugin');

class SimulatorScreenshotPlugin extends ScreenshotArtifactPlugin {
  constructor(config) {
    super(config);

    this.appleSimUtils = config.appleSimUtils;
    this.client = config.client;
    this.client.setEventCallback('testFailed', this._onInvokeFailure.bind(this));
  }

  async onBeforeLaunchApp({ launchArgs }) {
    if (this.enabled && this.shouldTakeAutomaticSnapshots && this.takeAutomaticSnapshots.testFailure) {
      launchArgs.detoxDebugVisibility = 'YES';
    }
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

  _onInvokeFailure({ params }) {
    const { visibilityFailingScreenshotsURL, visibilityFailingRectsURL } = params;

    this._registerSnapshot('visibilityFailingScreenshots/', new FileArtifact({
      temporaryPath: visibilityFailingScreenshotsURL
    }));

    this._registerSnapshot('visibilityFailingRects/', new FileArtifact({
      temporaryPath: visibilityFailingRectsURL
    }));
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

module.exports = SimulatorScreenshotPlugin;
