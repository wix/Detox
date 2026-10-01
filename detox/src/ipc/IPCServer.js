const { uniqBy } = require('lodash');
const { IPC } = require('node-ipc');

const { serializeObjectWithError } = require('../utils/errorUtils');

class IPCServer {
  /**
   * @param {object} options
   * @param {import('./SessionState')} options.sessionState
   * @param {Detox.Logger} options.logger
   * @param {object} options.callbacks
   * @param {(deviceConfig: DetoxInternals.RuntimeConfig['device']) => Promise<any>} options.callbacks.onAllocateDevice
   * @param {(cookie: any) => Promise<void>} options.callbacks.onDeallocateDevice
   */
  constructor({ sessionState, logger, callbacks }) {
    this._sessionState = sessionState;
    this._logger = logger.child({ cat: 'ipc,ipc-server' });
    this._ipc = null;
    this._callbacks = callbacks;
    this._workers = new Set();
    this._contexts = new Set();
    /** @type {Map<any, Map<string, any>>} the device cookies each connected socket still holds */
    this._socketDevices = new Map();
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
      // It is worth to handle rejection here some day
      this._ipc.serve(() => resolve());
      this._ipc.server.on('conductEarlyTeardown', this.onConductEarlyTeardown.bind(this));
      this._ipc.server.on('registerContext', this.onRegisterContext.bind(this));
      this._ipc.server.on('registerWorker', this.onRegisterWorker.bind(this));
      this._ipc.server.on('reportTestResults', this.onReportTestResults.bind(this));
      this._ipc.server.on('allocateDevice', this.onAllocateDevice.bind(this));
      this._ipc.server.on('deallocateDevice', this.onDeallocateDevice.bind(this));
      this._ipc.server.on('socket.disconnected', this.onSocketDisconnected.bind(this));
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
      unsafe_earlyTeardown: this._sessionState.unsafe_earlyTeardown,
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

  onConductEarlyTeardown({ permanent }, socket = null) {
    const newState = { unsafe_earlyTeardown: true };
    if (permanent) {
      Object.assign(this._sessionState, newState);
    }

    if (socket) {
      this._ipc.server.emit(socket, 'conductEarlyTeardownDone', newState);
    }

    this._ipc.server.broadcast('sessionStateUpdate', newState);
  }

  async onAllocateDevice({ deviceConfig }, socket) {
    let deviceCookie;

    try {
      deviceCookie = await this._callbacks.onAllocateDevice(deviceConfig);
    } catch (error) {
      this._ipc.server.emit(socket, 'allocateDeviceDone', serializeObjectWithError({ error }));
      return;
    }

    if (socket.destroyed) {
      // The worker disconnected while its device was being allocated
      await this._freeAbandonedDevice(deviceCookie);
      return;
    }

    if (!this._socketDevices.has(socket)) {
      this._socketDevices.set(socket, new Map());
    }

    this._socketDevices.get(socket).set(deviceCookie.id, deviceCookie);
    this._ipc.server.emit(socket, 'allocateDeviceDone', { deviceCookie });
  }

  /**
   * A worker that dies (crash, OOM, SIGKILL) never deallocates its devices, so they would stay
   * busy for the rest of the session and a retry could not reuse them. IPCClient never reconnects,
   * so a disconnected socket's devices can't be in use any more.
   */
  async onSocketDisconnected(socket) {
    const devices = this._socketDevices.get(socket);
    this._socketDevices.delete(socket);

    for (const deviceCookie of devices ? devices.values() : []) {
      await this._freeAbandonedDevice(deviceCookie);
    }
  }

  async _freeAbandonedDevice(deviceCookie) {
    this._logger.warn(`Freeing device ${deviceCookie.id}: the worker that allocated it disconnected without deallocating it`);

    try {
      await this._callbacks.onDeallocateDevice(deviceCookie);
    } catch (err) {
      this._logger.error({ err }, `Failed to free device ${deviceCookie.id}`);
    }
  }

  async onDeallocateDevice({ deviceCookie }, socket) {
    const devices = this._socketDevices.get(socket);
    if (devices) {
      devices.delete(deviceCookie.id);
    }

    try {
      await this._callbacks.onDeallocateDevice(deviceCookie);
      this._ipc.server.emit(socket, 'deallocateDeviceDone', {});
    } catch (error) {
      this._ipc.server.emit(socket, 'deallocateDeviceDone', serializeObjectWithError({ error }));
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
