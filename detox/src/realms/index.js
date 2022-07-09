function current() {
  if (process.env.DETOX_CONFIG_SNAPSHOT_PATH) {
    const secondary = require('./secondary');
    const { init } = require('../symbols');
    secondary[init]();
    return secondary;
  } else {
    return require('./primary');
  }
}

/** @type {Detox.DetoxExportWrapper} */
module.exports = global['__detox__'] || current();
