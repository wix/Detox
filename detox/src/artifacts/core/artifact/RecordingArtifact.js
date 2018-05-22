const DetoxRuntimeError = require('../../../errors/DetoxRuntimeError');

class RecordingArtifact {
  constructor() {
    this._startPromise = null;
    this._stopPromise = null;
    this._savePromise = null;
    this._discardPromise = null;
  }

  start() {
    if (!this._startPromise) {
      this._startPromise = this.doStart();
    }

    return this._startPromise;
  }

  stop() {
    if (!this._stopPromise) {
      if (this._startPromise) {
        this._stopPromise = this._startPromise.then(() => this.doStop());
      } else {
        this._stopPromise = this._startPromise = Promise.resolve();
      }
    }

    return this._stopPromise;
  }

  save(artifactPath) {
    if (!this._savePromise) {
      let error = null;
      error = error || this._assertRecordingIsNotBeingDiscarded();
      error = error || this._assertRecordingHasBeenStarted();

      if (error) {
        return Promise.reject(error);
      }

      this._savePromise = this.stop().then(() => this.doSave(artifactPath));
    }

    return this._savePromise;
  }

  discard() {
    if (!this._discardPromise) {
      if (this._savePromise) {
        this._discardPromise = this._savePromise;
      } else if (this._startPromise) {
        this._discardPromise = this.stop().then(() => this.doDiscard());
      } else {
        this._discardPromise = this._stopPromise = this._startPromise = Promise.resolve();
      }
    }

    return this._discardPromise;
  }

  async doStart() {}

  async doStop() {}

  async doSave(artifactPath) {}

  async doDiscard() {}

  _assertRecordingIsNotBeingDiscarded() {
    if (this._discardPromise) {
      return new DetoxRuntimeError({
        message: 'Cannot save recording because it is already being discarded',
        hint: 'Make sure you did not call .discard() method earlier',
      });
    }
  }

  _assertRecordingHasBeenStarted() {
    if (!this._startPromise) {
      return new DetoxRuntimeError({
        message: 'Cannot save recording if it has never been started',
        hint: 'This error is not supposed to happen, open an issue on Github if you see it.',
      });
    }
  }
}

module.exports = RecordingArtifact;
