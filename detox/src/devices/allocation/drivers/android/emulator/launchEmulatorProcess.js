const fs = require('fs');

const _ = require('lodash');

const unitLogger = require('../../../../../utils/logger').child({ cat: 'device' });

function launchEmulatorProcess(emulatorExec, adb, emulatorLaunchCommand) {
  let childProcessOutput;
  const portName = emulatorLaunchCommand.port ? `-${emulatorLaunchCommand.port}` : '';
  const tempLog = `./${emulatorLaunchCommand.avdName}${portName}.log`;
  const stdout = fs.openSync(tempLog, 'a');
  const stderr = fs.openSync(tempLog, 'a');

  function detach() {
    if (childProcessOutput) {
      return;
    }

    childProcessOutput = fs.readFileSync(tempLog, 'utf8');

    fs.closeSync(stdout);
    fs.closeSync(stderr);
    fs.unlink(tempLog, _.noop);
  }

  let log = unitLogger.child({ fn: 'boot' });
  log.debug({ event: 'SPAWN_CMD' }, emulatorExec.toString(), emulatorLaunchCommand.toString());

  const childProcessPromise = emulatorExec.spawn(emulatorLaunchCommand, stdout, stderr);
  childProcessPromise.childProcess.unref();

  log = log.child({ child_pid: childProcessPromise.childProcess.pid });

  adb.waitForDevice(emulatorLaunchCommand.adbName).then(() => childProcessPromise._cpResolve());

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

module.exports = { launchEmulatorProcess };
