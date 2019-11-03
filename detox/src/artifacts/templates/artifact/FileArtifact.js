const fs = require('fs-extra');
const Artifact = require('./Artifact');

class FileArtifact extends Artifact {
  constructor(template) {
    super(template);

    if (template.temporaryPath) {
      this.start();
      this.stop();
    }
  }

  async doSave(artifactPath) {
    await FileArtifact.moveTemporaryFile(this.logger, this.temporaryPath, artifactPath);
  }

  async doDiscard() {
    await fs.remove(this.temporaryPath);
  }

  static async moveTemporaryFile(logger, source, destination) {
    if (await fs.exists(source)) {
      logger.debug({ event: 'MOVE_FILE' }, `moving "${source}" to ${destination}`);
      await fs.move(source, destination);
      return true;
    } else {
      logger.warn({ event: 'MOVE_FILE_MISSING'} , `did not find temporary file: ${source}`);
      return false;
    }
  }
}


module.exports = FileArtifact;
