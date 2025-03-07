const { execAsync, spawnAndLog } = require('../../../../../utils/childProcess');

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
    return await execAsync(`"${this.binary}" ${command._getArgsString()}`);
  }

  spawn(command, stdout, stderr) {
    return spawnAndLog(this.binary, command._getArgs(), {
      detached: true,
      encoding: 'utf8',
      stdio: ['ignore', stdout, stderr]
    });
  }
}

module.exports = {
  ExecCommand,
  BinaryExec
};
