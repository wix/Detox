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
      if (typeof template.start === 'function') {
        this.doStart = template.start.bind(template);
      }
      if (typeof template.stop === 'function') {
        this.doStop = template.stop.bind(template);
      }
      if (typeof template.save === 'function') {
        this.doSave = template.save.bind(template);
      }
      if (typeof template.discard === 'function') {
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
      if (this._discardPromise) {
        log.warn('detox-artifacts', 'cannot save an already discarded artifact to: %s', artifactPath);
        this._savePromise = this._discardPromise;
      } else if (this._startPromise) {
        this._savePromise = this.stop().then(() => this.doSave(artifactPath, ...args));
      } else {
        this._savePromise = this._stopPromise = this._startPromise = Promise.resolve();
      }
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
}

module.exports = Artifact;
