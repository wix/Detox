const ipc = require('node-ipc');

const Deferred = require('../utils/Deferred');

const state = {
  open: false,
  detoxConfig: new Deferred(),
  workersCount: 1,
};

module.exports = {
  async init({
    serverId = process.env.DETOX_IPC_SERVER_ID,
    workerId = process.env.JEST_WORKER_ID || '0',
  } = {}) {
    await new Promise((resolve, reject) => {
      ipc.config.id = `${serverId}-${workerId}`;
      ipc.config.retry = 1000;
      ipc.config.stopRetrying = true;
      ipc.config.sync = true;
      ipc.config.silent = true;
      ipc.connectTo(serverId, function() {
        const server = state.server = ipc.of[serverId];
        server.on('error', reject);
        server.on('connect', () => {
          state.open = true;
          server.emit('registerWorker', { workerId });
          resolve();
        });
        server.on('disconnect', () => {
          state.open = false;
        });
        server.on('detoxConfig', (detoxConfig) => {
          state.detoxConfig.resolve(detoxConfig);
        });
        server.on('workersCount', ({ value }) => {
          state.workersCount = value;
        });
      });
    });
  },

  async getDetoxConfig() {
    return state.detoxConfig.promise;
  },

  log(level, meta, ...args) {
    if (state.open) {
      state.server.emit('app.message', {
        type: 'log',
        level,
        meta,
        args,
      });
    } else {
      console.error('Whoops...', level, meta, ...args);
    }
  },
};
