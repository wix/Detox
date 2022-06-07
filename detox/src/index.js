function current() {
  return process.env.DETOX_IPC_SERVER_ID ? require('./realms/secondary') : require('./realms/primary');
}

module.exports = global['__detox__'] || current();
