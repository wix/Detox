const log = require('../../../utils/logger').child({ __filename });

const EMU_BIN_VERSION_DETECT_EV = 'EMU_BIN_VERSION_DETECT';

class EmulatorVersion {
  constructor(emulator) {
    this.emulator = emulator;
    this.version = undefined;
  }

  async resolve() {
    if (!this.version) {
      this.version = await this._resolve();
    }
    return this.version;
  }

  async _resolve() {
    const rawOutput = await this.emulator.queryVersion() || '';
    const matches = rawOutput.match(/Android emulator version ([0-9]+\.[0-9]+\.[0-9]+\.[0-9]*)/);
    if (!matches) {
      log.warn({ event: EMU_BIN_VERSION_DETECT_EV, success: false }, 'Could not detect emulator binary version, got:', rawOutput);
      return null;
    }

    const version = this._parseVersionString(matches[1]);
    log.debug({ event: EMU_BIN_VERSION_DETECT_EV, success: true }, 'Detected emulator binary version', version);
    return version;
  }

  _parseVersionString(versionRaw) {
    const [major, minor, patch] = versionRaw.split('\.');
    return {
      major: Number(major),
      minor: Number(minor),
      patch: Number(patch),
    };
  }
}
module.exports = EmulatorVersion;
