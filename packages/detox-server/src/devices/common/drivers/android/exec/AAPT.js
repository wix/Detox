// @ts-nocheck
const exec = require('../../../../../utils/childProcess').execWithRetriesAndLogs;
const { getAaptPath } = require('../../../../../utils/environment');
const pipeCommands = require('../../../../../utils/pipeCommands');

const escape = pipeCommands.escape.inQuotedString;

class AAPT {
  constructor() {
    this.aaptBin = null;
  }

  async _prepare() {
    this.aaptBin = this.aaptBin || `"${escape(await getAaptPath())}"`;
  }

  async getPackageName(apkPath) {
    await this._prepare();

    const command = `${this.aaptBin} dump badging "${escape(apkPath)}"`;
    const process = await exec(command, { retries: 1 });
    const packageName = new RegExp(/^package: name='([^']+)'/gm).exec(process.stdout);
    return packageName && packageName[1];
  }

  async isTestAPK(apkPath) {
    await this._prepare();

    const command = `${this.aaptBin} dump xmlstrings "${escape(apkPath)}" AndroidManifest.xml`;
    const process = await exec(command, { retries: 1, verbosity: 'low' });
    return new RegExp(/^String #[0-9]*: instrumentation/gm).test(process.stdout);
  }
}

module.exports = AAPT;
