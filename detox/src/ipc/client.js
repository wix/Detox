const ipc = require('node-ipc').default;

const Deferred = require('../utils/Deferred');

const state = {
  open: false,
  detoxConfig: new Deferred(),
};

module.exports = {
  async init({
    serverId = process.env.DETOX_IPC_SERVER_ID,
    workerId = process.env.JEST_WORKER_ID,
  }) {
    return new Promise((resolve, reject) => {
      ipc.config.id = `${serverId}-${process.env.JEST_WORKER_ID}`;
      ipc.config.retry = 1000;
      ipc.config.sync = true;
      ipc.connectTo(serverId, function() {
        const server = state.server = ipc.of[serverId];
        server.on('error', reject);
        server.on('connect', () => {
          state.open = true;

          server.emit('app.message', {
            type: 'registerWorker',
            workerId,
          });

          resolve();
        });

        server.on('disconnect', () => {
          state.open = false;
        });

        server.on('app.message', ({ type, ...payload }) => {
          switch (type) {
            case 'registerWorkerDone': {
              const { detoxConfig } = payload;
              state.detoxConfig.resolve(detoxConfig);
              break;
            }
          }
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
