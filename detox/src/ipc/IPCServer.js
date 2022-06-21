const { IPC } = require('node-ipc');

const SessionState = require('./SessionState');

class IPCServer {
  constructor({ id, logger, detoxConfig }) {
    this._id = id;
    this._logger = logger.child({ __filename, event: 'IPC_SERVER' });
    this._state = new SessionState({
      detoxConfig,
      workersCount: 0,
    });
    this._ipc = null;
  }

  get id() {
    return this._id;
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

  onRegisterContext({ workerId }, socket) {
    this._ipc.server.emit(socket, 'registerContextDone', this._state);

    if (workerId && workerId > this._state.workersCount) {
      const workersCount = this._state.workersCount = workerId;
      this._ipc.server.broadcast('sessionStateUpdate', { workersCount });
    }
  }
}

module.exports = IPCServer;
