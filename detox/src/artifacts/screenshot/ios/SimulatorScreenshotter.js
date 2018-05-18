const Snapshotter = require('../../core/factory/Snapshotter');
const tempfile = require('tempfile');
const SimulatorScreenshot = require('./SimulatorScreenshot');

class SimulatorScreenshotter extends Snapshotter {
  constructor(config) {
    super(config);

    this.appleSimUtils = config.appleSimUtils;
    this.udid = config.udid;
  }

  async snapshot() {
    return new SimulatorScreenshot({
      appleSimUtils: this.appleSimUtils,
      udid: this.udid,
      temporaryFilePath: tempfile('.png'),
    });
  }
}

module.exports = SimulatorScreenshot;
