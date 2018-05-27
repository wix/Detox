const _ = require('lodash');
const log = require('npmlog');
const DetoxRuntimeError = require('../../../errors/DetoxRuntimeError');

class Artifact {
  constructor(template) {
    this._startPromise = null;
    this._stopPromise = null;
    this._savePromise = null;
    this._discardPromise = null;

    if (template) {
      if (_.isFunction(template.start)) {
        this.doStart = template.start.bind(template);
      }
      if (_.isFunction(template.stop)) {
        this.doStop = template.stop.bind(template);
      }
      if (_.isFunction(template.save)) {
        this.doSave = template.save.bind(template);
      }
      if (_.isFunction(template.discard)) {
        this.doDiscard = template.discard.bind(template);
      }
    }
  }

  start(...args) {
    if (this._savePromise) {
      this._startPromise = this._savePromise.then(() => this.doStart(...args));
    } else if (this._discardPromise) {
      this._startPromise = this._discardPromise.then(() => this.doStart(...args));
    } else if (this._startPromise || this._stopPromise) {
      this._startPromise = this.stop().then(() => this.doStart(...args));
    } else {
      this._startPromise = this.doStart(...args);
    }

    this._stopPromise = this._savePromise = this._discardPromise = null;
    return this._startPromise;
  }

  stop(...args) {
    if (!this._stopPromise) {
      if (this._startPromise) {
        this._stopPromise = this._startPromise.then(() => this.doStop(...args));
      } else {
        this._stopPromise = this._startPromise = Promise.resolve();
      }
    }

    return this._stopPromise;
  }

  save(artifactPath, ...args) {
    if (!this._savePromise) {
      let error = this._assertRecordingHasBeenStarted();
      if (error) {
        return Promise.reject(error);
      }

      if (this._discardPromise) {
        log.warn('detox', 'cannot save an already discarded artifact to: %s', artifactPath);
        return this._discardPromise;
      }

      this._savePromise = this.stop().then(() => this.doSave(artifactPath, ...args));
    }

    return this._savePromise;
  }

  discard(...args) {
    if (!this._discardPromise) {
      if (this._savePromise) {
        this._discardPromise = this._savePromise;
      } else if (this._startPromise) {
        this._discardPromise = this.stop().then(() => this.doDiscard(...args));
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

module.exports = Artifact;
