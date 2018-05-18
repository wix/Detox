const tempfile = require('tempfile');
const ensureExtension = require('../../utils/ensureExtension');
const SimulatorScreenshot = require('./SimulatorScreenshot');

class SimulatorScreenshotter {
  constructor(config) {
    this.appleSimUtils = config.appleSimUtils;
    this.udid = config.udid;
  }

  async snapshot(artifactPath) {
    return new SimulatorScreenshot({
      appleSimUtils: this.appleSimUtils,
      temporaryFilePath: tempfile('.png'),
      artifactPath: ensureExtension(artifactPath, '.png'),
    });
  }
}

module.exports = SimulatorScreenshot;
