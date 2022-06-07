const { IPC } = require('node-ipc');

const Deferred = require('../utils/Deferred');

class IPCClient {
  constructor({ serverId, workerId }) {
    this.ipc = null;
    this.server = null;
    this.detoxConfig = new Deferred();
    this.workersCount = 0;
    this.serverId = serverId;
    this.workerId = workerId;
  }

  async setup() {
    this.ipc = new IPC();

    Object.assign(this.ipc.config, {
      id: `${this.serverId}-${this.workerId}`,
      retry: 1000,
      stopRetrying: true,
      sync: false,
      silent: true,
    });

    await new Promise((resolve, reject) => {
      this.ipc.connectTo(this.serverId, () => {
        const server = this.ipc.of[this.serverId];
        server.on('error', reject);
        server.on('connect', () => {
          this.server = server;
          server.emit('registerWorker', {
            workerId: this.workerId,
          });
          resolve();
        });
        server.on('disconnect', () => {
          this.server = null;
        });
        server.on('detoxConfig', (detoxConfig) => {
          this.detoxConfig.resolve(detoxConfig);
        });
        server.on('workersCount', ({ value }) => {
          this.workersCount = value;
        });
      });
    });
  }

  async teardown() {
    this.server = null;
    this.ipc.disconnect(this.serverId);
  }

  async getDetoxConfig() {
    return this.detoxConfig.promise;
  }

  log(level, meta, args) {
    if (this.server) {
      this.server.emit('log', {
        level,
        meta,
        args,
      });
    } else {
      console.error('Whoops...', level, meta, ...args);
    }
  }
}

module.exports = IPCClient;
