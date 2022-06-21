const { IPC } = require('node-ipc');

const { DetoxInternalError } = require('../errors');

const SessionState = require('./SessionState');

class IPCClient {
  constructor({ logger, id, serverId, workerId }) {
    this._onSessionStateUpdate = this._onSessionStateUpdate.bind(this);

    this._state = new SessionState({});
    this._logger = logger.child({ __filename, event: 'IPC_CLIENT' });

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
    });

    await this._connectToServer();
    await this._registerContext();
  }

  async dispose() {
    if (this._serverConnection) {
      this._removeListeners();
      this._serverConnection = null;
    }

    this._client.disconnect(this._serverId);
  }

  get sessionState() {
    return this._state;
  }

  async _connectToServer() {
    return new Promise((resolve, reject) => {
      const serverId = this._serverId;
      this._client.connectTo(serverId, (client) => {
        const server = client.of[serverId];
        server
          .on('disconnect', () => {
            this._serverConnection = null;
          })
          .on('error', function onError(e) {
            server.off('error', onError);
            reject(e);
          })
          .on('connect', () => {
            this._serverConnection = server;
            this._addListeners();
            resolve();
          });
      });
    });
  }

  async _registerContext() {
    const sessionState = await this._emit('registerContext', {
      id: this._id,
      workerId: this._workerId,
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

  _onSessionStateUpdate(payload) {
    this._state.patch(payload);
  }

  _addListeners() {
    this._serverConnection.on('sessionStateUpdate', this._onSessionStateUpdate);
  }

  _removeListeners() {
    this._serverConnection.off('sessionStateUpdate', this._onSessionStateUpdate);
  }
}

module.exports = IPCClient;
