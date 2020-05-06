const spawn = require('child-process-promise').spawn;
const exec = require('../../../../utils/exec').execWithRetriesAndLogs;

class ExecCommand {
  toString() {
    return this._getArgsString();
  }

  _getArgs() {}
  _getArgsString() {
    return this._getArgs().join(' ');
  }
}

class BinaryExec {
  constructor(binary) {
    this.binary = binary;
  }

  toString() {
    return this.binary;
  }

  async exec(command) {
    return (await exec(`"${this.binary}" ${command._getArgsString()}`, this._getOptions())).stdout;
  }

  spawn(command, stdout, stderr) {
    return spawn(this.binary, command._getArgs(), { detached: true, stdio: ['ignore', stdout, stderr], ...this._getOptions() });
  }

  _getOptions() {
    return undefined;
  }
}

module.exports = {
  ExecCommand,
  BinaryExec,
};
