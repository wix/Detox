const spawn = require('child-process-promise').spawn;
const exec = require('../../../../utils/exec').execWithRetriesAndLogs;

class ExecCommand {
  toString() {
    return this._getArgsString();
  }

  _getArgs() {
    return [];
  }

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
    return (await exec(`"${this.binary}" ${command._getArgsString()}`)).stdout;
  }

  spawn(command, stdout, stderr) {
    return spawn(this.binary, command._getArgs(), { detached: true, stdio: ['ignore', stdout, stderr] });
  }
}

module.exports = {
  ExecCommand,
  BinaryExec,
};
