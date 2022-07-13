function current() {
  if (process.env.DETOX_CONFIG_SNAPSHOT_PATH) {
    return require('./secondary');
  } else {
    return require('./primary');
  }
}

/** @type {DetoxInternals.Facade} */
module.exports = global['__detox__'] || current();
