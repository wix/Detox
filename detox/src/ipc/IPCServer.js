class IPCServer {
  constructor({ id, logger, detoxConfig }) {
    this._id = id;
    this._logger = logger;
    this._state = {
      workers: 0,
      detoxConfig,
    };
    this._ipc = null;
  }

  get id() {
    return this._id;
  }

  async setup() {
    this._ipc = require('node-ipc');
    this._ipc.config.id = this._id;
    this._ipc.config.retry = 1500;
    this._ipc.config.silent = true;

    await new Promise((resolve) => {
      // TODO: handle reject
      this._ipc.serve(() => resolve());
      this._ipc.server.on('registerWorker', this.onRegisterWorker.bind(this));
      this._ipc.server.on('log', this.onLog.bind(this));
      this._ipc.server.start();
    });
  }

  async teardown() {
    if (!this._ipc) {
      return;
    }

    return new Promise((resolve, reject) =>{
      // @ts-ignore
      this._ipc.server.server.close(e => e ? reject(e) : resolve());
    });
  }

  onRegisterWorker({ workerId }, _socket) {
    const workersCount = this._state.workers = Math.max(this._state.workers, +workerId);
    const detoxConfig = this._state.detoxConfig;
    // TODO: change only for 1 worker (!))
    this._ipc.server.broadcast('detoxConfig', detoxConfig);
    this._ipc.server.broadcast('workersCount', { value: workersCount });
  }

  onLog({ level, args }) {
    this._logger[level](args);
  }
}

module.exports = IPCServer;
