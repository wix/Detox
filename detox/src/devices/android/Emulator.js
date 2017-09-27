const path = require('path');
const exec = require('../../utils/exec').execWithRetriesAndLogs;
const spawn = require('child-process-promise').spawn;
const _ = require('lodash');
const log = require('npmlog');
const Environment = require('../../utils/environment');

class Emulator {

  constructor() {
    this.emulatorBin = path.join(Environment.getAndroidSDKPath(), 'tools', 'emulator');
  }

  async boot(emulatorName) {
    await this.spawnEmulator(`-verbose -gpu host -no-audio @${emulatorName}`);
  }

  async listAvds() {
    const output = await this.exec(`-list-avds --verbose`);
    const avds = output.trim().split('\n');
    return avds;
  }

  async exec(cmd) {
    return (await exec(`${this.emulatorBin} ${cmd}`)).stdout;
  }

  async spawnEmulator(cmd) {
    const promise = spawn(this.emulatorBin, _.split(cmd, ' '));

    const childProcess = promise.childProcess;
    childProcess.stdout.on('data', function(data) {
      log.verbose('Emulator stdout: ', data.toString());
      const output = data.toString();
      if (output.includes('Adb connected, start proxing data')) {
        promise._cpResolve();
      }
      if (output.includes(`There's another emulator instance running with the current AVD`)) {
        promise._cpResolve();
      }
    });
    childProcess.stderr.on('data', function(data) {
      log.verbose('Emulator stderr: ', data.toString());
    });

    promise.catch(function(err) {
      log.error('Emulator ERROR: ', err);
    });

    return promise;
  }
}

module.exports = Emulator;
