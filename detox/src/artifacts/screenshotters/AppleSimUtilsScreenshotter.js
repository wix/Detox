const fs = require('fs-extra');
const tempfile = require('tempfile');
const ensureExtension = require('../utils/ensureExtension');
const AppleSimUtilsScreenshotHandle = require('./AppleSimUtilsScreenshotHandle');

class AppleSimUtilsScreenshotter {
  constructor(config) {
    this.appleSimUtils = config.appleSimUtils;
    this.temporaryFilePath = config.temporaryFilePath;
    this.udid = config.udid;
  }

  async takeScreenshot(artifactPath) {
    const temporaryPngPath = tempfile('.png');
    await fs.ensureFile(temporaryPngPath);
    await this.appleSimUtils.takeScreenshot(this.udid, temporaryPngPath);

    return new AppleSimUtilsScreenshotHandle({
      temporaryFilePath: temporaryPngPath,
      artifactPath: ensureExtension(artifactPath, '.png'),
    });
  }
}

module.exports = AppleSimUtilsScreenshotter;
