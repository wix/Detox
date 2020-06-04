if (global.detox) {
  module.exports = global.detox;
} else {
  const DetoxExportWrapper = require('./DetoxExportWrapper');
  module.exports = new DetoxExportWrapper();
}
