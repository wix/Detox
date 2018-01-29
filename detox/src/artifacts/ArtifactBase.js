class ArtifactBase {
  constructor(source) {
    this._source = source;
  }

  toString() {
    return this._source;
  }

  copy(destination) {
  }

  move(destination) {
  }
}

module.exports = ArtifactBase;
