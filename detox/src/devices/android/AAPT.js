const _ = require('lodash');
const Environment = require('../../utils/environment');
const path = require('path');
const which = require('which');
const exec = require('../../utils/exec').execWithRetriesAndLogs;
const escape = require('../../utils/pipeCommands').escape.inQuotedString;
const egrep = require('../../utils/pipeCommands').search.fragment;
const fsext = require('../../utils/fsext');

class AAPT {

  constructor() {
    this.aaptBin = null;
  }

  async _prepare() {
    try{
      const sdkPath = Environment.getAndroidSDKPath();
      const buildToolsDirs = await fsext.getDirectories(path.join(sdkPath, 'build-tools'));
      const latestBuildToolsVersion = _.last(buildToolsDirs);
      this.aaptBin = path.join(sdkPath, 'build-tools', latestBuildToolsVersion, 'aapt');
    } catch(err) {
      const aaptOnPath =  which.sync('aapt', {nothrow: true});
      if (aaptOnPath) {
        this.aaptBin = aaptOnPath;
        return;
      }
      throw new Error(err);
    }
  }

  async getPackageName(apkPath) {
    await this._prepare();
    const process = await exec(
      `${this.aaptBin} dump badging "${escape(apkPath)}" | ${egrep("package: name=")}`,
      undefined, undefined, 1
    );

    const packageName = new RegExp(/package: name='([^']+)'/g).exec(process.stdout);
    return packageName[1];
  }
}

module.exports = AAPT;
