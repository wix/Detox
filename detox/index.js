function create() {
  if (process.env.DETOX_CONFIG_SNAPSHOT_PATH) {
    return require('./src/realms/secondary');
  } else {
    return require('./src/realms/primary');
  }
}

/** @type {Detox.DetoxExportWrapper} */
module.exports = global['__detox__']
  ? global['__detox__'].clientApi
  : create();
