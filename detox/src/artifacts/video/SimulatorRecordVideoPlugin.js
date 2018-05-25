const fs = require('fs-extra');
const tempfile = require('tempfile');
const VideoArtifactPlugin = require('./VideoArtifactPlugin');
const interruptProcess = require('../../utils/interruptProcess');

class SimulatorRecordVideoPlugin extends VideoArtifactPlugin {
  constructor(config) {
    super(config);

    this.appleSimUtils = config.appleSimUtils;
  }

  createTestRecording() {
    const { api, appleSimUtils } = this;
    const temporaryFilePath = tempfile('.mp4');
    let processPromise = null;

    return {
      async start() {
        processPromise = appleSimUtils.recordVideo(api.getDeviceId(), temporaryFilePath);
      },
      async stop() {
        if (processPromise) {
          await interruptProcess(processPromise);
        }
      },
      async save(artifactPath) {
        await fs.move(temporaryFilePath, artifactPath);
      },
      async discard() {
        await fs.remove(temporaryFilePath);
      },
      kill() {
        if (processPromise) {
          interruptProcess(processPromise, 'SIGTERM');
        }

        fs.removeSync(temporaryFilePath);
      },
    };
  }
}

module.exports = SimulatorRecordVideoPlugin;