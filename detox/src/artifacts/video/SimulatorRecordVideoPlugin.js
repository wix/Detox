const fs = require('fs-extra');
const log = require('../../utils/logger').child({ __filename });
const temporaryPath = require('../utils/temporaryPath');
const VideoArtifactPlugin = require('./VideoArtifactPlugin');
const Artifact = require('../templates/artifact/Artifact');
const FileArtifact = require('../templates/artifact/FileArtifact');
const { interruptProcess } = require('../../utils/exec');

class SimulatorRecordVideoPlugin extends VideoArtifactPlugin {
  constructor(config) {
    super(config);

    this.appleSimUtils = config.appleSimUtils;
  }

  createTestRecording() {
    const { api, context, appleSimUtils } = this;
    const temporaryFilePath = temporaryPath.for.mp4();
    let processPromise = null;

    return new Artifact({
      name: 'SimulatorVideoRecording',
      start: async () => {
        processPromise = appleSimUtils.recordVideo(context.deviceId, temporaryFilePath, api.userConfig.simulator);
      },
      stop: async () => {
        if (processPromise) {
          await interruptProcess(processPromise);
        }
      },
      save: async (artifactPath) => {
        await FileArtifact.moveTemporaryFile(log, temporaryFilePath, artifactPath);
      },
      discard: async () => {
        await fs.remove(temporaryFilePath);
      },
    });
  }
}

module.exports = SimulatorRecordVideoPlugin;
