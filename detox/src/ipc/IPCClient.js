const { IPC } = require('node-ipc');

const { DetoxInternalError } = require('../errors');

const { SecondarySessionState } = require('./state');

class IPCClient {
  constructor({ logger, id, serverId, workerId }) {
    this._state = new SecondarySessionState({});
    /** @type {import('../logger/DetoxLogger')} logger */
    this._logger = logger.child({ __filename, cat: 'ipc-client,ipc' });

    this._id = id;
    this._serverId = serverId;
    this._workerId = workerId;

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
      this._client.disconnect(this._serverId);
      this._client = null;
    }
  }

  get sessionState() {
    return this._state;
  }

  /**
   * @param {string[]} testFilePaths
   */
  async reportFailedTests(testFilePaths) {
    await this._emit('failedTests', { testFilePaths });
  }

  async _connectToServer() {
    const serverId = this._serverId;

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
    const sessionState = await this._emit('registerContext', {
      id: this._id,
      workerId: this._workerId,
      logFile: this._logger.config.file,
    });

    this._state.patch(sessionState);
  }

  async _emit(event, payload) {
    if (!this._serverConnection) {
      throw new DetoxInternalError(`IPC server ${this._serverId} has unexpectedly disconnected.`);
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
