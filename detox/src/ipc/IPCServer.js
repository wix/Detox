const { uniqBy } = require('lodash');
const { IPC } = require('node-ipc');

const { serializeObjectWithError } = require('../utils/errorUtils');

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
    this._contexts = new Set();
  }

  get id() {
    return this._sessionState.detoxIPCServer;
  }

  get contexts() {
    return [...this._contexts];
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
      this._ipc.server.on('reportTestResults', this.onReportTestResults.bind(this));
      this._ipc.server.start();
    });
  }

  async dispose() {
    if (!this._ipc) {
      return;
    }

    await new Promise((resolve, reject) =>{
      // @ts-ignore
      this._ipc.server.server.close(e => /* istanbul ignore next */
        e ? reject(e) : resolve());
      this._ipc.server.stop();
    });

    this._ipc = null;
  }

  onRegisterContext({ id }, socket) {
    this._contexts.add(id);

    this._ipc.server.emit(socket, 'registerContextDone', {
      testResults: this._sessionState.testResults,
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

  onReportTestResults({ testResults }, socket = null) {
    const merged = uniqBy([
      ...testResults.map(r => serializeObjectWithError(r, 'testExecError')),
      ...this._sessionState.testResults
    ], 'testFilePath');

    this._sessionState.testResults.splice(0, Infinity, ...merged);

    if (socket) {
      this._ipc.server.emit(socket, 'reportTestResultsDone', {
        testResults: this._sessionState.testResults,
      });
    }

    this._ipc.server.broadcast('sessionStateUpdate', {
      testResults: this._sessionState.testResults,
    });
  }
}

module.exports = IPCServer;
