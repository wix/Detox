const path = require('path');

const fs = require('fs-extra');
const tempfile = require('tempfile');

const appendFile = require('../../../utils/appendFile');

const Artifact = require('./Artifact');

class FileArtifact extends Artifact {
  constructor(template) {
    super(template);

    if (template.temporaryPath || template.temporaryData) {
      this.start();
      this.stop();
    }
  }

  async relocate() {
    if (!this.temporaryPath || !(await fs.exists(this.temporaryPath))) {
      return;
    }

    const newTemporaryPath = tempfile(path.extname(this.temporaryPath));
    await FileArtifact.moveTemporaryFile(this.logger, this.temporaryPath, newTemporaryPath);
    this.temporaryPath = newTemporaryPath;
  }

  async doSave(artifactPath, options = {}) {
    if (this.temporaryPath) {
      await FileArtifact.moveTemporaryFile(this.logger, this.temporaryPath, artifactPath, options.append);
    } else /* if (this.temporaryData) */ {
      await FileArtifact.writeFile(this.logger, this.temporaryData, artifactPath, options.append);
    }
  }

  async doDiscard() {
    await fs.remove(this.temporaryPath);
  }

  static async writeFile(logger, data, destination, canAppend = false) {
    if (!data) {
      logger.warn({ event: 'FILE_WRITE_EMPTY_DATA' }, `there is no data to write to "${destination}"`);

      return false;
    }

    if (!await fs.exists(destination)) {
      logger.debug({ event: 'FILE_WRITE_CREATE' }, `creating file "${destination}"`);
    } else if (!canAppend) {
      logger.warn({ event: 'FILE_WRITE_EXISTS' }, `cannot overwrite "${destination}"`);

      return false;
    }

    if (canAppend) {
      logger.debug({ event: 'FILE_WRITE' }, `writing to "${destination}" via appending`);
      await fs.appendFile(destination, data);

      return true;
    } else {
      logger.debug({ event: 'FILE_WRITE' }, `writing to "${destination}"`);
      await fs.writeFile(destination, data);

      return true;
    }
  }

  static async moveTemporaryFile(logger, source, destination, canAppend = false) {
    if (!await fs.exists(source)) {
      logger.warn({ event: 'MOVE_FILE_MISSING' }, `did not find temporary file: ${source}`);
      return false;
    }

    if (!await fs.exists(destination)) {
      logger.debug({ event: 'MOVE_FILE' }, `moving "${source}" to ${destination}`);
      await fs.move(source, destination);
      return true;
    }

    if (canAppend) {
      logger.debug({ event: 'MOVE_FILE' }, `moving "${source}" to ${destination} via appending`);
      await appendFile(source, destination);
      await fs.remove(source);
      return true;
    }

    logger.warn({ event: 'MOVE_FILE_EXISTS' }, `cannot overwrite: "${source}" => "${destination}"`);
    await fs.remove(source);
    return false;
  }
}

module.exports = FileArtifact;
