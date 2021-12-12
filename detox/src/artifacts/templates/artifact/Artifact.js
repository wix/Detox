const log = require('../../../utils/logger').child({ __filename });

class Artifact {
  constructor(template) {
    defineNonEnumerableProperties(this, Artifact.nonEnumerableProperties);

    if (template) {
      const { name, start, stop, save, discard, ...misc } = template;

      Object.assign(this, misc);
      this._name = name;

      if (typeof start === 'function') {
        this.doStart = start.bind(this);
      }

      if (typeof stop === 'function') {
        this.doStop = stop.bind(template);
      }

      if (typeof save === 'function') {
        this.doSave = save.bind(template);
      }

      if (typeof discard === 'function') {
        this.doDiscard = discard.bind(template);
      }
    }

    this._startPromise = null;
    this._stopPromise = null;
    this._savePromise = null;
    this._discardPromise = null;
    this.logger = log.child({ class: this.name });
  }

  get name() {
    return this._name || this.constructor.name;
  }

  start(...args) {
    this.logger.trace({ event: 'ARTIFACT_START' }, `starting ${this.name}`, ...args);

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
      this.logger.trace({ event: 'ARTIFACT_STOP' }, `stopping ${this.name}`, ...args);

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
      this.logger.trace({ event: 'ARTIFACT_SAVE' }, `saving ${this.name} to: ${artifactPath}`, ...args);

      if (this._discardPromise) {
        this.logger.warn({ event: 'ERROR' }, `cannot save an already discarded artifact to: ${artifactPath}`);
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
      this.logger.trace({ event: 'ARTIFACT_DISCARD' }, `discarding ${this.name}`, ...args);

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

  async doSave(artifactPath) {} // eslint-disable-line no-unused-vars

  async doDiscard() {}
}

Artifact.nonEnumerableProperties = [
  '_name',
  '_startPromise',
  '_stopPromise',
  '_savePromise',
  '_discardPromise',
  'logger',
  'doStart',
  'doStop',
  'doSave',
  'doDiscard',
];

function defineNonEnumerableProperties(obj, props) {
  for (const prop of props) {
    Object.defineProperty(obj, prop, {
      enumerable: false,
      writable: true,
      value: obj[prop],
    });
  }
}

module.exports = Artifact;
