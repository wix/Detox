function resolveLoggerClass() {
  if (global.IS_RUNNING_DETOX_UNIT_TESTS) {
    // TODO: return NullLogger maybe?
    return require('../../realms/root/BunyanLogger');
  }

  if (process.env.JEST_WORKER_ID) {
    return require('./IPCLogger');
  } else {
    return require('../../realms/root/BunyanLogger');
  }
}

const Logger = resolveLoggerClass();
module.exports = new Logger({});
