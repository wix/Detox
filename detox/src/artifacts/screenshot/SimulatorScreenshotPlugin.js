const path = require('path');

const fs = require('../../utils/fsext');
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

  async onBeforeUninstallApp(event) {
    await this.api.requestIdleCallback(async () => {
      const snapshots = [
        ...Object.values(this.snapshots.fromTest),
        ...Object.values(this.snapshots.fromSession)
      ];

      await Promise.all(snapshots.map(s => s && s.relocate()));
    });

    await super.onBeforeUninstallApp(event);
  }

  _onInvokeFailure({ params }) {
    const visibilityArtifactDirs = [
      params.visibilityFailingScreenshotsURL,
      params.visibilityFailingRectsURL
    ].filter(Boolean);

    for (const visibilityDir of visibilityArtifactDirs) {
      for (const innerFile of fs.readdirSync(visibilityDir)) {
        const ext = path.extname(innerFile);
        if (ext === '.png') {
          const artifactName = path.basename(innerFile, ext).replace(/ /g, '_');
          this._registerSnapshot(artifactName, new FileArtifact({
            temporaryPath: path.join(visibilityDir, innerFile),
          }));
        }
      }
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

module.exports = SimulatorScreenshotPlugin;
