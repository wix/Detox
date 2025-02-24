const { spawn } = require('promisify-child-process');

const exec = require('../../../../../utils/childProcess').execWithRetriesAndLogs;

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
    const result = await exec(`"${this.binary}" ${command._getArgsString()}`);

    return result.stdout;
  }

  spawn(command, stdout, stderr) {
    return spawn(this.binary, command._getArgs(), { detached: true, encoding: 'utf8', stdio: ['ignore', stdout, stderr] });
  }
}

module.exports = {
  ExecCommand,
  BinaryExec
};
