const { IPC } = require('node-ipc');

const { DetoxInternalError } = require('../errors');
const { serializeObjectWithError, deserializeObjectWithError } = require('../utils/errorUtils');

class IPCClient {
  constructor({ id, logger, sessionState }) {
    this._id = id;
    /** @type {import('../logger/DetoxLogger')} logger */
    this._logger = logger.child({ cat: 'ipc' });
    /** @type {import('./SessionState')} */
    this._sessionState = sessionState;

    this._ipc = null;
    this._serverConnection = null;
  }

  async init() {
    this._ipc = new IPC();

    Object.assign(this._ipc.config, {
      id: this._id,
      appspace: 'detox.',
      logger: (msg) => this._logger.trace(msg),
      stopRetrying: 0,
      maxRetries: 0,
    });

    await this._connectToServer();
    await this._registerContext();
  }

  async dispose() {
    this._serverConnection = null;

    if (this._ipc) {
      await new Promise((resolve, reject) => {
        this._ipc.of[this.serverId]
          // @ts-ignore
          .once('disconnect', resolve)
          .once('error', reject);

        this._ipc.disconnect(this.serverId);
      });

      this._ipc = null;
    }
  }

  get sessionState() {
    return this._sessionState;
  }

  get serverId() {
    return this.sessionState.detoxIPCServer;
  }

  async registerWorker(workerId) {
    const sessionState = await this._emit('registerWorker', { workerId });
    this._sessionState.patch(sessionState);
  }

  async allocateDevice(deviceConfig) {
    const { deviceCookie, error } = deserializeObjectWithError(await this._emit('allocateDevice', { deviceConfig }));
    if (error) {
      throw error;
    }

    return deviceCookie;
  }

  async deallocateDevice(deviceCookie) {
    const { error } = deserializeObjectWithError(await this._emit('deallocateDevice', { deviceCookie }));
    if (error) {
      throw error;
    }
  }

  /**
   * @param {DetoxInternals.DetoxTestFileReport[]} testResults
   */
  async reportTestResults(testResults) {
    const sessionState = await this._emit('reportTestResults', {
      testResults: testResults.map(r => serializeObjectWithError(r, 'testExecError')),
    });
    this._sessionState.patch(sessionState);
  }

  async conductEarlyTeardown({ permanent }) {
    const sessionState = await this._emit('conductEarlyTeardown', { permanent });
    this._sessionState.patch(sessionState);
  }

  async _connectToServer() {
    const serverId = this.serverId;

    this._serverConnection = await new Promise((resolve, reject) => {
      this._ipc.connectTo(serverId, (client) => {
        client.of[serverId]
          .once('error', reject)
          .once('disconnect', () => reject(new DetoxInternalError('IPC server has unexpectedly disconnected.')))
          .once('connect', () => resolve(client.of[serverId]));
      });
    });

    this._serverConnection.on('sessionStateUpdate', this._onSessionStateUpdate);
  }

  async _registerContext() {
    const sessionState = await this._emit('registerContext', { id: this._id });
    this._sessionState.patch(sessionState);
  }

  async _emit(event, payload) {
    if (!this._serverConnection) {
      throw new DetoxInternalError(`IPC server ${this.serverId} has unexpectedly disconnected.`);
    }

    return new Promise((resolve, reject) => {
      const server = this._serverConnection;

      /* istanbul ignore next */
      function onError(err) {
        server.off('error', onError);
        server.off(`${event}Done`, onDone);
        reject(err);
      }

      function onDone(response) {
        server.off(`${event}Done`, onDone);
        server.off('error', onError);
        resolve(response);
      }

      server
        .on('error', onError)
        .on(`${event}Done`, onDone)
        .emit(event, payload);
    });
  }

  _onSessionStateUpdate = (payload) => {
    this._sessionState.patch(payload);
  };
}

module.exports = IPCClient;
