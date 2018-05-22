const DetoxRuntimeError = require('../../../errors/DetoxRuntimeError');

class SnapshotArtifact {
  constructor() {
    this._createPromise = null;
    this._savePromise = null;
    this._discardPromise = null;
  }

  create() {
    if (!this._createPromise) {
      this._createPromise = this.doCreate();
    }

    return this._createPromise;
  }

  save(artifactPath) {
    if (!this._savePromise) {
      let error = null;
      error = error || this._assertArtifactWasCreated('save');
      error = error || this._assertArtifactIsNotBeingDiscarded();

      if (error) {
        return Promise.reject(error);
      }

      this._savePromise = this._createPromise.then(() => this.doSave(artifactPath));
    }

    return this._savePromise;
  }

  discard() {
    if (!this._discardPromise) {
      if (this._createPromise) {
        this._discardPromise = this._createPromise.then(() => this.doDiscard());
      } else {
        this._discardPromise = this._createPromise = Promise.resolve();
      }
    }

    return this._discardPromise;
  }

  async doCreate() {}

  async doSave(artifactPath) {}

  async doDiscard() {}

  _assertArtifactWasCreated(actionName) {
    if (!this._createPromise) {
      return new DetoxRuntimeError({
        message: `Cannot ${actionName} artifact because it has not been created yet`,
        hint: 'Make sure you had called .create() method earlier',
      });
    }
  }

  _assertArtifactIsNotBeingDiscarded() {
    if (this._discardPromise) {
      return new DetoxRuntimeError({
        message: 'Cannot save artifact because it is already being discarded',
        hint: 'Make sure you did not call .discard() method earlier',
      });
    }
  }
}

module.exports = SnapshotArtifact;