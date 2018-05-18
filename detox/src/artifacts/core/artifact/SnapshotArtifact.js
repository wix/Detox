class SnapshotArtifact {
  constructor() {
    this._createPromise = null;
    this._savePromise = null;
    this._discardPromise = null;
  }

  create() {
    this._assertArtifactHasNotBeenCreatedYet();
    this._createPromise = this.doCreate();

    return this._createPromise;
  }

  save(artifactPath) {
    this._assertArtifactWasCreated('save');
    this._assertArtifactIsNotBeingDiscarded();

    if (!this._savePromise) {
      this._savePromise = this.doSave(artifactPath);
    }

    return this._savePromise;
  }

  discard() {
    this._assertArtifactWasCreated('discard');
    this._assertArtifactIsNotBeingSaved();

    if (!this._discardPromise) {
      this._discardPromise = this.doDiscard();
    }

    return this._discardPromise;
  }

  async doCreate() {}

  async doSave(artifactPath) {}

  async doDiscard() {}

  _assertArtifactHasNotBeenCreatedYet() {
    if (this._createPromise) {
      throw new DetoxRuntimeError({
        message: `It is forbidden to call .create() method twice on the same artifact`,
        hint: `Make sure you don't call .create() method somewhere earlier`,
      });
    }
  }

  _assertArtifactWasCreated(actionName) {
    if (!this._createPromise) {
      throw new DetoxRuntimeError({
        message: `Cannot ${actionName} artifact because it has not been created yet`,
        hint: 'Make sure you had called .create() method earlier',
      });
    }
  }

  _assertArtifactIsNotBeingDiscarded() {
    if (this._discardPromise) {
      throw new DetoxRuntimeError({
        message: 'Cannot save artifact because it is already being discarded',
        hint: 'Make sure you did not call .discard() method earlier',
      });
    }
  }

  _assertArtifactIsNotBeingSaved() {
    if (this._savePromise) {
      throw new DetoxRuntimeError({
        message: 'Cannot discard artifact because it is already being saved',
        hint: 'Make sure you did not call .save() method earlier',
      });
    }
  }
}

module.exports = SnapshotArtifact;