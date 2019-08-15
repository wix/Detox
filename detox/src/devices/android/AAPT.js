const _ = require('lodash');
const Environment = require('../../utils/environment');
const fs = require('fs-extra');
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
    if (this.aaptBin) {
      return;
    }

    const sdkPath = Environment.getAndroidSDKPath();

    let latestBuildToolsVersion = '';

    const buildToolsDir = path.join(sdkPath, 'build-tools');
    if (fs.pathExistsSync(buildToolsDir)) {
      const buildToolsDirs = await fsext.getDirectories(buildToolsDir);
      latestBuildToolsVersion = _.last(buildToolsDirs);
    }

    const buildToolsDirLatestVersion = path.join(
      sdkPath,
      'build-tools',
      latestBuildToolsVersion,
    );

    this.aaptBin =
      which.sync('aapt', {path: buildToolsDirLatestVersion, nothrow: true}) ||
      which.sync('aapt', {nothrow: true});

    if (this.aaptBin == null) {
      throw new Error(Environment.MISSING_SDK_ERROR);
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
