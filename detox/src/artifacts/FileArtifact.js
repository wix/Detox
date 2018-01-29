const ArtifactBase = require('./ArtifactBase');
const sh = require('../utils/sh');

class FileArtifact extends ArtifactBase {
  async copy(destination) {
    await sh.cp(`"${this._source}" "${destination}"`);
  }

  async move(destination) {
    await sh.mv(`"${this._source}" "${destination}"`);
  }
}

module.exports = FileArtifact;
