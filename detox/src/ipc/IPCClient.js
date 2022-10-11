const { IPC } = require('node-ipc');

const { DetoxInternalError } = require('../errors');
const { serializeObjectWithError } = require('../utils/errorUtils');

class IPCClient {
  constructor({ id, logger, state }) {
    this._id = id;
    /** @type {import('../logger/DetoxLogger')} logger */
    this._logger = logger.child({ cat: 'ipc' });
    /** @type {import('./SessionState')} */
    this._state = state;

    this._client = null;
    this._serverConnection = null;
  }

  async init() {
    this._client = new IPC();

    Object.assign(this._client.config, {
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

    if (this._client) {
      this._client.disconnect(this.serverId);
      this._client = null;
    }
  }

  get sessionState() {
    return this._state;
  }

  get serverId() {
    return this.sessionState.detoxIPCServer;
  }

  async registerWorker(workerId) {
    await this._emit('registerWorker', { workerId });
  }

  /**
   * @param {DetoxInternals.DetoxTestFileReport[]} testResults
   */
  async reportTestResults(testResults) {
    await this._emit('reportTestResults', {
      testResults: testResults.map(r => serializeObjectWithError(r, 'testExecError')),
    });
  }

  async _connectToServer() {
    const serverId = this.serverId;

    this._serverConnection = await new Promise((resolve, reject) => {
      this._client.connectTo(serverId, (client) => {
        client.of[serverId]
          .on('error', reject)
          .on('disconnect', () => reject(new DetoxInternalError('IPC server has unexpectedly disconnected.')))
          .on('connect', () => resolve(client.of[serverId]));
      });
    });

    this._serverConnection.on('sessionStateUpdate', this._onSessionStateUpdate);
  }

  async _registerContext() {
    const sessionState = await this._emit('registerContext', { id: this._id });
    this._state.patch(sessionState);
  }

  async _emit(event, payload) {
    if (!this._serverConnection) {
      throw new DetoxInternalError(`IPC server ${this.serverId} has unexpectedly disconnected.`);
    }

    return new Promise((resolve, reject) => {
      const server = this._serverConnection;

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
    this._state.patch(payload);
  };
}

module.exports = IPCClient;
