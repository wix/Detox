const _ = require('lodash');
const fs = require('fs');
const Tail = require('tail').Tail;
const AndroidDeviceLauncher = require('../../AndroidDeviceLauncher');
const EmulatorTelnet = require('../../tools/EmulatorTelnet');
const { LaunchCommand } = require('../../exec/EmulatorExec');
const unitLogger = require('../../../../../utils/logger').child({ __filename });
const retry = require('../../../../../utils/retry');

const isUnknownEmulatorError = (err) => (err.message || '').includes('failed with code null');

class EmulatorLauncher extends AndroidDeviceLauncher {
  constructor(emulatorExec, eventEmitter, telnetGeneratorFn = () => new EmulatorTelnet()) {
    super(eventEmitter);
    this._emulatorExec = emulatorExec;
    this._telnetGeneratorFn = telnetGeneratorFn;
  }

  async launch(emulatorName, options = {port: undefined}) {
    const launchCommand = new LaunchCommand(emulatorName, options);

    return await retry({
      retries: 2,
      interval: 100,
      conditionFn: isUnknownEmulatorError,
    }, () => this._launchEmulator(emulatorName, launchCommand));
  }

  async shutdown(adbName) {
    await this._notifyPreShutdown(adbName);
    const port = _.split(adbName, '-')[1];
    const telnet = this._telnetGeneratorFn();
    await telnet.connect(port);
    await telnet.kill();
    await this._notifyShutdownCompleted(adbName);
  }

  _launchEmulator(emulatorName, launchCommand) {
    let childProcessOutput;
    const portName = launchCommand.port ? `-${launchCommand.port}` : '';
    const tempLog = `./${emulatorName}${portName}.log`;
    const stdout = fs.openSync(tempLog, 'a');
    const stderr = fs.openSync(tempLog, 'a');
    const tailOptions = {
      useWatchFile: true,
      fsWatchOptions: {
        interval: 1500,
      },
    };
    const tail = new Tail(tempLog, tailOptions)
      .on("line", (line) => {
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

    let log = unitLogger.child({ fn: 'boot' });
    log.debug({ event: 'SPAWN_CMD' }, this._emulatorExec.toString(), launchCommand.toString());
    const childProcessPromise = this._emulatorExec.spawn(launchCommand, stdout, stderr);
    childProcessPromise.childProcess.unref();
    log = log.child({ child_pid: childProcessPromise.childProcess.pid });

    return childProcessPromise.then(() => true).catch((err) => {
      detach();

      if (childProcessOutput.includes(`There's another emulator instance running with the current AVD`)) {
        return false;
      }

      log.error({ event: 'SPAWN_FAIL', error: true, err }, err.message);
      log.error({ event: 'SPAWN_FAIL', stderr: true }, childProcessOutput);
      throw err;
    }).then((coldBoot) => {
      detach();
      log.debug({ event: 'SPAWN_SUCCESS', stdout: true }, childProcessOutput);
      return coldBoot;
    });
  }
}

module.exports = EmulatorLauncher;
