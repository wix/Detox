const fs = require('fs-extra');
const Artifact = require('./Artifact');
const appendFile = require('../../../utils/appendFile');

class FileArtifact extends Artifact {
  constructor(template) {
    super(template);

    if (template.temporaryPath) {
      this.start();
      this.stop();
    }
  }

  async doSave(artifactPath, options = {}) {
    await FileArtifact.moveTemporaryFile(this.logger, this.temporaryPath, artifactPath, options.append);
  }

  async doDiscard() {
    await fs.remove(this.temporaryPath);
  }

  static async moveTemporaryFile(logger, source, destination, canAppend = false) {
    if (!await fs.exists(source)) {
      logger.warn({event: 'MOVE_FILE_MISSING'}, `did not find temporary file: ${source}`);
      return false;
    }

    if (!await fs.exists(destination)) {
      logger.debug({event: 'MOVE_FILE'}, `moving "${source}" to ${destination}`);
      await fs.move(source, destination);
      return true;
    }

    if (canAppend) {
      logger.debug({event: 'MOVE_FILE'}, `moving "${source}" to ${destination} via appending`);
      await appendFile(source, destination);
      await fs.remove(source);
      return true;
    }

    logger.warn({event: 'MOVE_FILE_EXISTS'}, `cannot overwrite: "${source}" => "${destination}"`);
    await fs.remove(source);
    return false;
  }
}


module.exports = FileArtifact;
