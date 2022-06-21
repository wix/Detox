const { IPC } = require('node-ipc');

const SessionState = require('./SessionState');

/**
 * @typedef {object} ServerState
 * @property {string[]} contexts
 * @property {string[]} logFiles
 */

class IPCServer {
  constructor({ id, logger, detoxConfig }) {
    this._id = id;
    this._logger = logger.child({ __filename, event: 'IPC_SERVER' });

    this._sessionState = new SessionState({
      detoxConfig,
      workersCount: 0,
    });

    /** @type {ServerState} */
    this._serverState = {
      contexts: [],
      logFiles: [],
    };

    this._ipc = null;
  }

  get id() {
    return this._id;
  }

  get state() {
    return this._serverState;
  }

  get sessionState() {
    return this._sessionState;
  }

  async init() {
    this._ipc = new IPC();
    this._ipc.config.id = this._id;
    this._ipc.config.appspace = 'detox.';
    this._ipc.config.logger = (msg) => this._logger.trace(msg);

    await new Promise((resolve) => {
      // TODO: handle reject
      this._ipc.serve(() => resolve());
      this._ipc.server.on('registerContext', this.onRegisterContext.bind(this));
      this._ipc.server.start();
    });
  }

  async dispose() {
    if (!this._ipc) {
      return;
    }

    return new Promise((resolve, reject) =>{
      // @ts-ignore
      this._ipc.server.server.close(e => e ? reject(e) : resolve());
    });
  }

  onRegisterContext({ id, logFile, workerId }, socket) {
    this._serverState.contexts.push(id);
    this._serverState.logFiles.push(logFile);
    this._ipc.server.emit(socket, 'registerContextDone', this._sessionState);

    if (workerId && workerId > this._sessionState.workersCount) {
      const workersCount = this._sessionState.workersCount = workerId;
      this._ipc.server.broadcast('sessionStateUpdate', { workersCount });
    }
  }
}

module.exports = IPCServer;
