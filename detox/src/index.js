function current() {
  return process.env.DETOX_CONFIG_SNAPSHOT_PATH ? require('./realms/secondary') : require('./realms/primary');
}

/** @type {Detox.DetoxExportWrapper} */
module.exports = global['__detox__'] || current();
