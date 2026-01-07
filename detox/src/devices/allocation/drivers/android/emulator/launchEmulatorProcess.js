/**
 * @typedef {import('../../../../common/drivers/android/emulator/exec/EmulatorExec').EmulatorExec} EmulatorExec
 * @typedef {import('../../../../common/drivers/android/exec/ADB')} ADB
 * @typedef {import('../../../../common/drivers/android/emulator/exec/EmulatorExec').LaunchCommand} LaunchCommand
 */

const fs = require('fs');

const _ = require('lodash');

const unitLogger = require('../../../../../utils/logger').child({ cat: 'device' });

/**
 * @param { EmulatorExec } emulatorExec - Instance for executing emulator commands
 * @param { ADB } adb - Instance of the Android Debug Bridge handler
 * @param { LaunchCommand } emulatorLaunchCommand - The command describing how to launch the emulator
 * @param { number|undefined } adbServerPort - Port number for ADB server, if any
 * @returns { Promise<any> } A Promise that resolves when the emulator process is launched and ready
 */
function launchEmulatorProcess(emulatorExec, adb, emulatorLaunchCommand, adbServerPort) {
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

  const childProcessPromise = emulatorExec.spawn(emulatorLaunchCommand, stdout, stderr, {
    env: {
      ...process.env,
      ANDROID_ADB_SERVER_PORT: adbServerPort ? String(adbServerPort) : undefined,
    },
  });
  childProcessPromise.childProcess.unref();

  log = log.child({ child_pid: childProcessPromise.childProcess.pid });

  // Create a deferred promise that resolves when the device is ready
  let resolveEmulatorReady;
  const emulatorReadyPromise = new Promise(resolve => {
    resolveEmulatorReady = resolve;
  });

  // Wait for the device to be ready
  adb.waitForDevice(emulatorLaunchCommand.adbName).then(() => {
    resolveEmulatorReady();
  });

  // Use Promise.race to resolve with the first one to complete - either the emulator process exits
  // or the emulator device is ready
  return Promise.race([childProcessPromise, emulatorReadyPromise])
    .then(() => true)
    .catch((err) => {
      detach();

      if (childProcessOutput && childProcessOutput.includes(`There's another emulator instance running with the current AVD`)) {
        return false;
      }

      log.error({ event: 'SPAWN_FAIL', error: true, err }, err.message);
      log.error({ event: 'SPAWN_FAIL', stderr: true }, childProcessOutput);
      throw err;
    })
    .then((coldBoot) => {
      detach();
      log.debug({ event: 'SPAWN_SUCCESS', stdout: true }, childProcessOutput);
      return coldBoot;
    });
}

module.exports = { launchEmulatorProcess };
