const fs = require('fs-extra');
const log = require('../../../utils/logger').child({ __filename });

class Artifact {
  constructor(template) {
    this._startPromise = null;
    this._stopPromise = null;
    this._savePromise = null;
    this._discardPromise = null;

    if (template) {
      this._name = template.name || '';

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

  get name() {
    return this._name || this.constructor.name;
  }

  start(...args) {
    log.trace({ event: 'START', class: this.name }, `starting ${this.name}`, ...args);

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
      log.trace({ event: 'STOP', class: this.name }, `stopping ${this.name}`, ...args);

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
      log.trace({ event: 'SAVE', class: this.name }, `saving ${this.name} to: ${artifactPath}`, ...args);

      if (this._discardPromise) {
        log.warn({ event: 'SAVE_ERROR' }, `cannot save an already discarded artifact to: ${artifactPath}`);
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
      log.trace({ event: 'DISCARD', class: this.name }, `discarding ${this.name}`, ...args);

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

  static async moveTemporaryFile(logger, source, destination) {
    if (await fs.exists(source)) {
      logger.debug({ event: 'MOVE_FILE' }, `moving "${source}" to ${destination}`);
      await fs.move(source, destination);
    } else {
      logger.warn({ event: 'MOVE_FILE_MISSING'} , `did not find temporary file: ${source}`);
    }
  }
}

module.exports = Artifact;
