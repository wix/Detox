const DetoxInvariantError = require('../errors/DetoxInvariantError');
const log = require('../utils/logger').child({ __filename });

class DetoxSession {
  /**
   * @param {string} id
   */
  constructor(id) {
    this._id = id;
    /** @type {DetoxConnection} */
    this._tester = null;
    /** @type {DetoxConnection} */
    this._app = null;

    log.trace({ event: 'SESSION_CREATED' }, `created session ${id}`);
  }

  get id() {
    return this._id;
  }

  get app() {
    return this._app;
  }

  set app(value) {
    if (value) {
      this._assertAppIsNotConnected();
      this._app = value;
      this._notifyAboutAppConnect();
    } else {
      this._app = null;
      this._notifyAboutAppDisconnect();
    }
  }

  get tester() {
    return this._tester;
  }

  set tester(value) {
    if (value) {
      this._assertTesterIsNotConnected();
      this._tester = value;
      this._notifyAboutTesterConnect();
    } else {
      this._tester = null;
      this._notifyAboutTesterDisconnect();
    }
  }

  get isEmpty() {
    return !this._tester && !this._app;
  }

  disconnect(connection) {
    if (!connection) {
      return this._invariant(`DetoxSession(${this.id}).prototype.disconnect(connection) expects a non-null argument.`);
    }

    if (connection === this.tester) {
      this.tester = null;
    } else if (connection === this.app) {
      this.app = null;
    } else {
      this._invariant(`cannot disconnect an unknown connection from the session ${this.id}`);
    }
  }

  _assertAppIsNotConnected() {
    if (this._app) {
      this._invariant(`the app is already connected to the session ${this.id}`);
    }
  }

  _assertTesterIsNotConnected() {
    if (this._tester) {
      this._invariant(`the tester is already connected to the session ${this.id}`);
    }
  }

  _notifyAboutAppConnect() {
    log.trace({ event: 'SESSION_JOINED' }, `app joined session ${this.id}`);

    if (!this._tester) {
      return;
    }

    this._tester.sendAction({
      type: 'appConnected',
    });
  }

  _notifyAboutAppDisconnect() {
    log.trace({ event: 'SESSION_TORN' }, `app exited session ${this.id}`);

    if (!this._tester) {
      return;
    }

    this._tester.sendAction({
      type: 'appDisconnected',
    });
  }

  _notifyAboutTesterConnect() {
    log.trace({ event: 'SESSION_JOINED' }, `tester joined session ${this.id}`);
  }

  _notifyAboutTesterDisconnect() {
    log.trace({ event: 'SESSION_TORN' }, `tester exited session ${this.id}`);

    if (!this._app) {
      return;
    }

    this._app.sendAction({
      type: 'testerDisconnected',
    });
  }

  _invariant(errorMessage) {
    log.error(DetoxInvariantError.from(errorMessage));
  }
}

module.exports = DetoxSession;
