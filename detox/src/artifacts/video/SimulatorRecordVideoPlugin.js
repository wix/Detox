const fs = require('fs-extra');
const log = require('../../utils/logger').child({ __filename });
const tempfile = require('tempfile');
const VideoArtifactPlugin = require('./VideoArtifactPlugin');
const Artifact = require('../templates/artifact/Artifact');
const { interruptProcess } = require('../../utils/exec');

class SimulatorRecordVideoPlugin extends VideoArtifactPlugin {
  constructor(config) {
    super(config);

    this.appleSimUtils = config.appleSimUtils;
  }

  createTestRecording() {
    const { context, appleSimUtils } = this;
    const temporaryFilePath = tempfile('.mp4');
    let processPromise = null;

    return new Artifact({
      name: 'SimulatorVideoRecording',
      start: async () => {
        processPromise = appleSimUtils.recordVideo(context.deviceId, temporaryFilePath);
      },
      stop: async () => {
        if (processPromise) {
          await interruptProcess(processPromise);
        }
      },
      save: async (artifactPath) => {
        if (await fs.exists(temporaryFilePath)) {
          await fs.move(temporaryFilePath, artifactPath);
        } else {
          log.error({ event: 'MOVE_FILE_ERROR' }, `could not find temporary file at: "${temporaryFilePath}"`);
        }
      },
      discard: async () => {
        await fs.remove(temporaryFilePath);
      },
    });
  }
}

module.exports = SimulatorRecordVideoPlugin;