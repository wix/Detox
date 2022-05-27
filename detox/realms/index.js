function current() {
  return process.env.DETOX_IPC_SERVER_ID ? require('./secondary') : require('./primary');
}

module.exports = current();
