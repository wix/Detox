const {getAaptPath} = require('../../../../utils/environment');
const exec = require('../../../../utils/exec').execWithRetriesAndLogs;
const escape = require('../../../../utils/pipeCommands').escape.inQuotedString;
const egrep = require('../../../../utils/pipeCommands').search.fragment;

class AAPT {
  constructor() {
    this.aaptBin = null;
  }

  async _prepare() {
    this.aaptBin = this.aaptBin || `"${escape(await getAaptPath())}"`;
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
