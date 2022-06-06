function current() {
  return process.env.DETOX_IPC_SERVER_ID ? require('./secondary') : require('./primary');
}

// TODO: improve somehow?
module.exports = global['__detox__'] || current();
