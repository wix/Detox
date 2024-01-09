const log = require('../../../../../utils/logger').child({ cat: 'device' });
const { QueryVersionCommand } = require('../../../../common/drivers/android/emulator/exec/EmulatorExec');

class EmulatorVersionResolver {
  constructor(emulatorExec) {
    this._emulatorExec = emulatorExec;
    this.version = undefined;
  }

  async resolve(isHeadless = false) {
    if (!this.version) {
      this.version = await this._resolve(isHeadless);
    }
    return this.version;
  }

  async _resolve(headless) {
    let rawOutput;
    try {
      rawOutput = await this._emulatorExec.exec(new QueryVersionCommand({ headless })) || '';
    } catch (error) {
      log.error({ success: false, error }, 'Could not detect emulator binary version', error);
      return null;
    }

    const matches = rawOutput.match(/Android emulator version ([0-9]+\.[0-9]+\.[0-9]+\.[0-9]*)/);
    if (!matches) {
      log.warn({ success: false }, 'Could not detect emulator binary version, got:', rawOutput);
      return null;
    }

    const version = this._parseVersionString(matches[1]);
    log.debug({ success: true }, 'Detected emulator binary version', version);
    return version;
  }

  _parseVersionString(versionRaw) {
    const [major, minor, patch] = versionRaw.split('.');
    return {
      major: Number(major),
      minor: Number(minor),
      patch: Number(patch),
      toString: () => versionRaw,
    };
  }
}
module.exports = EmulatorVersionResolver;
