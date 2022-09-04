const { IPC } = require('node-ipc');

class IPCServer {
  /**
   * @param {object} options
   * @param {import('./SessionState')} options.sessionState
   * @param {Detox.Logger} options.logger
   */
  constructor({ sessionState, logger }) {
    this._sessionState = sessionState;
    this._logger = logger.child({ cat: 'ipc,ipc-server' });
    this._ipc = null;
    this._workers = new Set();
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

  onRegisterContext({ id }, socket) {
    this._sessionState.contexts.push(id);

    this._ipc.server.emit(socket, 'registerContextDone', {
      failedTestFiles: this._sessionState.failedTestFiles,
      testFilesToRetry: this._sessionState.testFilesToRetry,
      testSessionIndex: this._sessionState.testSessionIndex,
    });
  }

  onRegisterWorker({ workerId }, socket = null) {
    const workersCount = this._workers.add(workerId).size;
    const shouldBroadcast = workersCount > this._sessionState.workersCount;
    this._sessionState.workersCount = workersCount;

    if (socket) {
      this._ipc.server.emit(socket, 'registerWorkerDone', { workersCount });
    }

    if (shouldBroadcast) {
      this._ipc.server.broadcast('sessionStateUpdate', { workersCount });
    }
  }

  onFailedTests({ testFilePaths, permanent }, socket = null) {
    if (permanent) {
      this._sessionState.failedTestFiles.push(...testFilePaths);
    } else {
      this._sessionState.testFilesToRetry.push(...testFilePaths);
    }

    if (socket) {
      this._ipc.server.emit(socket, 'failedTestsDone', {});
    }

    this._ipc.server.broadcast('sessionStateUpdate', {
      failedTestFiles: this._sessionState.failedTestFiles,
      testFilesToRetry: this._sessionState.testFilesToRetry,
    });
  }
}

module.exports = IPCServer;
