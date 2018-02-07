const ArtifactBase = require('../../artifacts/ArtifactBase');

class AndroidArtifact extends ArtifactBase {
  constructor(source, adb, deviceId) {
    super(source);
    this._adb = adb;
    this._deviceId = deviceId;
  }

  async copy(destination) {
    await this._adb.pull(this._deviceId, this._source, destination);
  }

  async move(destination) {
    await this.copy(destination);
    await this._adb.rm(this._deviceId, this._source, true);
  }

  async remove() {
    await this._adb.rm(this._deviceId, this._source, true);
  }
}

module.exports = AndroidArtifact;
