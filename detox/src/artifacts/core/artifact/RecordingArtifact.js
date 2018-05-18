const DetoxRuntimeError = require('../../../errors/DetoxRuntimeError');

class RecordingArtifact {
  constructor() {
    this._startPromise = null;
    this._stopPromise = null;
    this._savePromise = null;
    this._discardPromise = null;
  }

  start() {
    this._assertRecordingIsNotBeingResumed();

    if (!this._startPromise) {
      this._startPromise = this.doStart();
    }

    return this._startPromise;
  }

  stop() {
    this._assertRecordingHasBeenStarted();

    if (!this._stopPromise) {
      this._stopPromise = this.doStop();
    }

    return this._stopPromise;
  }

  save(artifactPath) {
    this._assertRecordingIsNotBeingDiscarded();

    if (!this._savePromise) {
      this._savePromise = this.stop().then(() => this.doSave(artifactPath));
    }

    return this._savePromise;
  }

  discard() {
    this._assertRecordingIsNotBeingSaved();

    if (!this._discardPromise) {
      this._discardPromise = this.stop().then(() => this.doDiscard());
    }

    return this._discardPromise;
  }

  async doStart() {}

  async doStop() {}

  async doSave(artifactPath) {}

  async doDiscard() {}

  _assertRecordingIsNotBeingResumed() {
    if (this._stopPromise) {
      throw new DetoxRuntimeError({
        message: 'Resuming recording after .stop() is not supported',
        hint: 'Consider creating new recording instead of .stop().start()',
      });
    }
  }

  _assertRecordingHasBeenStarted() {
    if (!this._startPromise) {
      throw new DetoxRuntimeError({
        message: 'Cannot stop recording if it has never been started',
        hint: 'This error is not supposed to happen, open an issue on Github if you see it.',
      });
    }
  }

  _assertRecordingIsNotBeingDiscarded() {
    if (this._discardPromise) {
      throw new DetoxRuntimeError({
        message: 'Cannot save recording because it is already being discarded',
        hint: 'Make sure you did not call .discard() method earlier',
      });
    }
  }

  _assertRecordingIsNotBeingSaved() {
    if (this._savePromise) {
      throw new DetoxRuntimeError({
        message: 'Cannot discard recording because it is already being saved',
        hint: 'Make sure you did not call .save() method earlier',
      });
    }
  }
}

module.exports = RecordingArtifact;
