const ensureExtension = require('../utils/ensureExtension');
const AppleSimUtilsScreenshotHandle = require('./AppleSimUtilsScreenshotHandle');

class AppleSimUtilsScreenshotter {
  constructor(config) {
    this.appleSimUtils = config.appleSimUtils;
    this.udid = config.udid;
  }

  async takeScreenshot(artifactPath) {
    const pngArtifactPath = ensureExtension(artifactPath, '.png');
    await fs.ensureFile(pngArtifactPath);
    await this.appleSimUtils.takeScreenshot(this.udid, pngArtifactPath);

    return new AppleSimUtilsScreenshotHandle({
      artifactPath: pngArtifactPath,
    });
  }
}

module.exports = AppleSimUtilsScreenshotter;
