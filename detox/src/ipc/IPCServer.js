const { IPC } = require('node-ipc');

class IPCServer {
  /**
   * @param {object} options
   * @param {import('./state').PrimarySessionState} options.sessionState
   * @param {Detox.Logger} options.logger
   */
  constructor({ sessionState, logger }) {
    this._sessionState = sessionState;
    this._logger = logger.child({ __filename, cat: 'ipc' });
    this._ipc = null;
  }

  get id() {
    return this._sessionState.detoxIPCServer;
  }

  get sessionState() {
    return this._sessionState;
  }

  async init() {
    this._ipc = new IPC();
    this._ipc.config.id = this.id;
    this._ipc.config.appspace = 'detox.';
    this._ipc.config.logger = (msg) => this._logger.trace(msg);

      await new Promise((resolve) => {
      // TODO: handle reject
      this._ipc.serve(() => resolve());
      this._ipc.server.on('registerContext', this.onRegisterContext.bind(this));
      this._ipc.server.on('registerWorker', this.onRegisterWorker.bind(this));
      this._ipc.server.on('failedTests', this.onFailedTests.bind(this));
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
      this._ipc.server.stop();
    });
  }

  onRegisterContext({ id, logFile }, socket) {
    this._sessionState.contexts.push(id);

    if (logFile && !this._sessionState.logFiles.includes(logFile)) {
      this._sessionState.logFiles.push(logFile);
    }

    this._ipc.server.emit(socket, 'registerContextDone', {});
  }

  onRegisterWorker({ workerId }, socket) {
    if (socket) {
      this._ipc.server.emit(socket, 'registerWorkerDone', {});
    }

    if (workerId > this._sessionState.workersCount) {
      const workersCount = this._sessionState.workersCount = workerId;
      this._ipc.server.broadcast('sessionStateUpdate', { workersCount });
    }
  }

  onFailedTests({ testFilePaths }, socket) {
    this._sessionState.failedTestFiles.push(...testFilePaths);

    if (socket) {
      this._ipc.server.emit(socket, 'failedTestsDone', {});
    }
  }
}

module.exports = IPCServer;
