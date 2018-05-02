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
    const emulatorArgs = _.compact([
      '-verbose',
      '-gpu', 'auto',
      '-no-audio',
      argparse.getArgValue('headless') ? '-no-window' : '',
      `@${emulatorName}`
    ]);

    let childProcessOutput;
    const tempLog = `./${emulatorName}.log`;
    const stdout = fs.openSync(tempLog, 'a');
    const stderr = fs.openSync(tempLog, 'a');
    const tail = new Tail(tempLog).on("line", (line) => {
      if (line.includes('Adb connected, start proxing data')) {
        childProcessPromise._cpResolve();
      }
    });

    function detach() {
      if (childProcessOutput) {
        return;
      }

      childProcessOutput = fs.readFileSync(tempLog, 'utf8');

      tail.unwatch();
      fs.closeSync(stdout);
      fs.closeSync(stderr);
      fs.unlink(tempLog, _.noop);
    }

    log.verbose(this.emulatorBin, ...emulatorArgs);
    const childProcessPromise = spawn(this.emulatorBin, emulatorArgs, { detached: true, stdio: ['ignore', stdout, stderr] });
    childProcessPromise.childProcess.unref();

    return childProcessPromise.catch((err) => {
      detach();

      if (childProcessOutput.includes(`There's another emulator instance running with the current AVD`)) {
        return;
      }

      log.error('ChildProcessError', '%s', err.message);
      log.error('stderr', '%s', childProcessOutput);
      throw err;
    }).then(() => {
      detach();
      log.verbose('stdout', '%s', childProcessOutput);
    });
  }
}

module.exports = Emulator;
