const _ = require('lodash');
const exec = require('child-process-promise').exec;
const Environment = require('../../utils/environment');
const path = require('path');
const fsext = require('../../utils/fsext');

class AAPT {

  constructor() {
    this.aaptBin = null;
  }

  async _prepare() {
    if (!this.aaptBin) {
      const sdkPath = Environment.getAndroidSDKPath();
      const buildToolsDirs = await fsext.getDirectories(path.join(sdkPath, 'build-tools'));
      const latestBuildToolsVersion = _.last(buildToolsDirs);
      this.aaptBin = path.join(sdkPath, 'build-tools', latestBuildToolsVersion, 'aapt');
    }
  }

  async getPackageName(apkPath) {
    await this._prepare();
    const process = await exec(`${this.aaptBin} dump badging "${apkPath}"`);
    const packageName = new RegExp(/package: name='([^']+)'/g).exec(process.stdout);
    return packageName[1];
  }
}

module.exports = AAPT;
