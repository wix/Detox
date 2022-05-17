const { capitalize } = require('lodash');

const { DetoxInternalError } = require('../../src/errors');

class IPCServer {
  constructor({ id, logger, detoxConfig }) {
    this._id = id;
    this._logger = logger;
    this._state = {
      workers: 0,
      detoxConfig,
    };

    this._controllerState = undefined;
    this._ipc = null;
  }

  get id() {
    return this._id;
  }

  async start() {
    this._ipc = require('node-ipc').default;
    this._ipc.config.id = this._id;
    this._ipc.config.retry = 1500;
    this._ipc.config.sync = true;

    return new Promise((resolve) => {
      // TODO: handle reject

      this._ipc.serve(() => {
        this._ipc.server.on('app.message', (data, socket) => {
          const { type, ...payload } = data;
          this._controllerState = {
            currentAction: type,
            currentSocket: socket,
          };

          return this[`on${capitalize(type)}`](payload);
        });

        resolve();
      });

      this._ipc.server.start();
    });
  }

  async stop() {
    return new Promise((resolve, reject) =>{
      this._ipc.server.server.close(e => e ? reject(e) : resolve());
    });
  }

  // noinspection JSUnusedGlobalSymbols
  onLog({ level, args }) {
    this._logger[level](args);
  }

  // noinspection JSUnusedGlobalSymbols
  onRegisterWorker({ workerId }) {
    const workersCount = this._state.workers = Math.max(this._state.workers, +workerId);
    const detoxConfig = this._state.detoxConfig;
    this.emit({ detoxConfig, workersCount });
    this.broadcast({ workersCount });
  }

  emit(payload, action) {
    const { currentAction, currentSocket } = this._getControllerStateGuaranteed();
    return this._ipc.server.emit(currentSocket, 'app.message', {
      type: action || `${currentAction}Done`,
      ...payload,
    });
  }

  broadcast(payload, action) {
    return this._ipc.server.broadcast('app.message', {
      type: action || `${this._getCurrentAction()}Done`,
      ...payload,
    });
  }

  _getCurrentAction() {
    return this._getControllerStateGuaranteed().currentAction;
  }

  _getControllerStateGuaranteed() {
    if (!this._controllerState) {
      throw new DetoxInternalError('Detected an attempt to emit IPC signal outside of a controller action');
    }

    return this._controllerState;
  }
}

module.exports = IPCServer;
