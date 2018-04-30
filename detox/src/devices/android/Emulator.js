const path = require('path');
const exec = require('../../utils/exec').execWithRetriesAndLogs;
const spawn = require('child-process-promise').spawn;
const _ = require('lodash');
const log = require('npmlog');
const fs = require('fs');
const Environment = require('../../utils/environment');
const Tail = require('tail').Tail;
const argparse = require('../../utils/argparse');

class Emulator {
  constructor() {
    this.emulatorBin = path.join(Environment.getAndroidSDKPath(), 'tools', 'emulator');
  }

  async listAvds() {
    const output = await this.exec(`-list-avds --verbose`);
    const avds = output.trim().split('\n');
    return avds;
  }

  async exec(cmd) {
    return (await exec(`${this.emulatorBin} ${cmd}`)).stdout;
  }

  async boot(emulatorName) {
    const cmd = _.compact([
        '-verbose',
        '-gpu',
        'host',
        '-no-audio',
        argparse.getArgValue('headless') ? '-no-window' : '',
        `@${emulatorName}`
    ]).join(' ');

    log.verbose(this.emulatorBin, cmd);
    const tempLog = `./${emulatorName}.log`;
    const stdout = fs.openSync(tempLog, 'a');
    const stderr = fs.openSync(tempLog, 'a');
    const tail = new Tail(tempLog);
    const promise = spawn(this.emulatorBin, _.split(cmd, ' '), {detached: true, stdio: ['ignore', stdout, stderr]});

    const childProcess = promise.childProcess;
    childProcess.unref();

    tail.on("line", function(line) {
      if (line.includes('Adb connected, start proxing data')) {
        detach();
        promise._cpResolve();
      }
    });

    function detach() {
        tail.unwatch();
        fs.closeSync(stdout);
        fs.closeSync(stderr);
        fs.unlink(tempLog, () => {});
    }

      return promise.catch(function(err) {
          const output = fs.readFileSync(tempLog, 'utf8');

          if (output.includes(`There's another emulator instance running with the current AVD`)) {
              log.verbose('stdout', '%s', output);
              return;
          }

          if (log.level === 'verbose') {
              log.error('ChildProcessError', '%j', err);
          } else {
              log.error('ChildProcessError', '%s', err.message);
          }

          log.error('stderr', '%s', output);
          detach();
          throw err;
      });
  }
}

module.exports = Emulator;
