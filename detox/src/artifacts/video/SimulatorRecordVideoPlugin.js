const fs = require('fs-extra');
const log = require('npmlog');
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
      start: async () => {
        processPromise = appleSimUtils.recordVideo(api.getDeviceId(), temporaryFilePath);
      },
      stop: async () => {
        if (processPromise) {
          const { stderr } = await interruptProcess(processPromise);

          if ((stderr || '').contains('Video recording requires hardware Metal capability')) {
            this.disable('the system does not have hardware Metal capability');
          }
        }
      },
      save: async (artifactPath) => {
        if (await fs.exists(temporaryFilePath)) {
          await fs.move(temporaryFilePath, artifactPath);
        } else {
          log.error('SimulatorRecordVideoPlugin', 'could not find temporary file at: %s', temporaryFilePath);
        }
      },
      discard: async () => {
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