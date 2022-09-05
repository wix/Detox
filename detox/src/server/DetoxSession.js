// @ts-nocheck
const DetoxInternalError = require('../errors/DetoxInternalError');
const log = require('../utils/logger').child({ cat: 'ws-server,ws-session' });

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
    /** @type {boolean | null} */
    this._pendingAppStatus = null;
    /** @type {boolean | null} */
    this._pendingTesterStatus = null;

    log.trace(`created session ${id}`);
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
      this._pendingAppStatus = true;
    } else {
      this._assertAppIsConnected();
      this._app = null;
      this._pendingAppStatus = false;
    }
  }

  get tester() {
    return this._tester;
  }

  set tester(value) {
    if (value) {
      this._assertTesterIsNotConnected();
      this._tester = value;
      this._pendingTesterStatus = true;
    } else {
      this._assertTesterIsConnected();
      this._tester = null;
      this._pendingTesterStatus = false;
    }
  }

  get isEmpty() {
    return !this._tester && !this._app;
  }

  notify() {
    if (this._pendingTesterStatus === true) {
      this._notifyAboutTesterConnect();
    }

    if (this._pendingTesterStatus === false) {
      this._notifyAboutTesterDisconnect();
    }

    if (this._pendingAppStatus === true) {
      this._notifyAboutAppConnect();
    }

    if (this._pendingAppStatus === false) {
      this._notifyAboutAppDisconnect();
    }

    this._pendingTesterStatus = null;
    this._pendingAppStatus = null;
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

  _assertAppIsConnected() {
    if (!this._app) {
      this._invariant(`no app is connected to the session ${this.id}`);
    }
  }

  _assertTesterIsNotConnected() {
    if (this._tester) {
      this._invariant(`the tester is already connected to the session ${this.id}`);
    }
  }

  _assertTesterIsConnected() {
    if (!this._tester) {
      this._invariant(`no tester is connected to the session ${this.id}`);
    }
  }

  _notifyAboutAppConnect() {
    log.trace(`app joined session ${this.id}`);

    if (!this._tester) {
      return;
    }

    this._tester.sendAction({
      type: 'appConnected',
    });
  }

  _notifyAboutAppDisconnect() {
    log.trace(`app exited session ${this.id}`);

    if (!this._tester) {
      return;
    }

    this._tester.sendAction({
      type: 'appDisconnected',
    });
  }

  _notifyAboutTesterConnect() {
    log.trace(`tester joined session ${this.id}`);
  }

  _notifyAboutTesterDisconnect() {
    log.trace(`tester exited session ${this.id}`);

    if (!this._app) {
      return;
    }

    this._app.sendAction({
      type: 'testerDisconnected',
      messageId: -1,
    });
  }

  _invariant(errorMessage) {
    log.error(DetoxInternalError.from(errorMessage));
  }
}

module.exports = DetoxSession;
