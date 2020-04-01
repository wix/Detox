const { ListAVDsCommand } = require('../tools/EmulatorExec');

class AVDsResolver {
  constructor(emulatorExec) {
    this._emulatorExec = emulatorExec;
  }

  async resolve() {
    const output = await this._emulatorExec.exec(new ListAVDsCommand());
    const avds = output.trim().split('\n');
    return avds;
  }
}

module.exports = AVDsResolver;
