function current() {
  return process.env.DETOX_CONFIG_SNAPSHOT_PATH ? require('./secondary') : require('./primary');
}

/** @type {Detox.DetoxExportWrapper} */
module.exports = global['__detox__'] || current();
