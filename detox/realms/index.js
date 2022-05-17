function current() {
  if (process.env.JEST_WORKER_ID) {
    return require('./worker');
  }

  if (process.env.DETOX_IPC_SERVER_ID) {
    return require('./runner');
  }

  return require('./root');
}

module.exports = current();
