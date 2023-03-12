const { exec } = require('child-process-promise');
const osascript = require('node-osascript');
const { Lock } = require('semaphore-async-await');

const log = require('../../../../utils/logger').child({ cat: 'device,xcuitest' });

async function launchXCUITest(
  simulatorId,
  detoxServer,
  detoxSessionId,
  bundleId,
  debugVisibility,
  disableDumpViewHierarchy,
  testTargetServerPort
) {
  log.debug('[XCUITest] Launch was called');

  const lock = new Lock();
  await _runLaunchCommand(
    simulatorId,
    detoxServer,
    detoxSessionId,
    bundleId,
    debugVisibility,
    disableDumpViewHierarchy,
    testTargetServerPort,
    () => {
      log.debug('[XCUITest] Releasing lock');
      lock.release();
    }
  );

  log.debug('[XCUITest] Waiting for the lock to be released..');

  await lock.acquire();
  await lock.acquire();
  log.debug('[XCUITest] Lock was released');
}

async function _runLaunchCommand(
  simulatorId,
  detoxServer,
  detoxSessionId,
  bundleId,
  debugVisibility,
  disableDumpViewHierarchy,
  testTargetServerPort,
  callback
) {
  log.info(`Launching XUICTest runner. See target logs using:\n` +
    `\t/usr/bin/xcrun simctl spawn ${simulatorId} log stream --level debug --style compact ` +
    `--predicate 'process == "DetoxTester-Runner" && subsystem == "com.wix.DetoxTester.xctrunner"'`);

  let command = `TEST_RUNNER_IS_DETOX_ACTIVE='1' ` +
    `TEST_RUNNER_DETOX_SERVER='${detoxServer}' ` +
    `TEST_RUNNER_DETOX_SESSION_ID='${detoxSessionId}' ` +
    `TEST_RUNNER_TEST_TARGET_SERVER_PORT='${testTargetServerPort}' ` +
    `TEST_RUNNER_BUNDLE_ID='${bundleId}' ` +
    `TEST_RUNNER_DETOX_DEBUG_VISIBILITY='${debugVisibility}' ` +
    `TEST_RUNNER_DETOX_DISABLE_VIEW_HIERARCHY_DUMP='${disableDumpViewHierarchy}' ` +
    `xcodebuild ` +
    `-workspace ../ios/DetoxTester.xcworkspace ` +
    `-scheme DetoxTester ` +
    `-sdk iphonesimulator ` +
    `-allowProvisioningUpdates ` +
    `-destination 'platform=iOS Simulator,id=${simulatorId}' ` +
    `test`;

  exec(command, { maxBuffer: 1024 * 1024 * 500 })
    .then(function (result) {
      log.info(`XCUITest runner execution finished`);
      log.debug(`xcodebuild output:\n${result.stdout.toString()}`);
    })
    .catch(function (error) {
      log.error(`xcodebuild error has occurred during XCUITest execution, see debug logs for more details`);
      log.debug(`xcodebuild error message:\n${error.stderr.toString()}`);
    });

  await _allowNetworkPermissionsXCUITest(callback);
}

async function getXcodeAppPath() {
  const { stdout: xcodeSelectStdout } = await exec('xcode-select -p');
  const xcodePath = xcodeSelectStdout.trim();
  log.debug(`[XCUITest] Xcode path: ${xcodePath}`);

  const xcodeAppPath = xcodePath.substring(0, xcodePath.lastIndexOf('.app') + 4);
  log.debug(`[XCUITest] Xcode app path: ${xcodeAppPath}`);

  return xcodeAppPath;
}

async function isXcodeDefinedInFirewall(xcodeAppPath) {
  const { stdout } = await exec('/usr/libexec/ApplicationFirewall/socketfilterfw --listapps');
  const result = stdout.includes(xcodeAppPath);
  log.debug(`[XCUITest] Xcode is defined in the Firewall app: ${result}`);
  return result;
}

async function _allowNetworkPermissionsXCUITest(callback) {
  log.debug(`[XCUITest] Allowing network permissions`);

  try {
    const xcodeAppPath = await getXcodeAppPath();

    // check if Xcode is already defined in the firewall apps (if not, add it):
    if (!(await isXcodeDefinedInFirewall(xcodeAppPath))) {
      log.debug(`[XCUITest] Xcode is not defined in the Firewall app, adding it`);

      const socketfilterfwPath = '/usr/libexec/ApplicationFirewall/socketfilterfw';

      log.debug(`[XCUITest] Adding Xcode to the Firewall app`);
      const addXcodeResult = await exec(socketfilterfwPath +' --add ' + xcodeAppPath +
        '/Contents/MacOS/Xcode');
      log.debug(`[XCUITest] Adding Xcode result: ${addXcodeResult.stdout}`);

      log.debug(`[XCUITest] Adding Simulator to the Firewall app`);
      const addSimulatorResult = await exec(socketfilterfwPath +' --add ' + xcodeAppPath +
        '/Contents/Developer/Applications/Simulator.app/Contents/MacOS/Simulator');
      log.debug(`[XCUITest] Adding Simulator result: ${addSimulatorResult.stdout}`);
    }

    if (await isXcodeDefinedInFirewall(xcodeAppPath)) {
      log.debug(`[XCUITest] Xcode was successfully added to the Firewall app`);
      callback();
      return;
    } else {
      log.error(
        `[XCUITest] Failed to add Xcode to the Firewall app using socketfilterfw, trying to add it using AppleScript`);
    }
  } catch (e) {
    log.error(`[XCUITest] Failed to add Xcode to the Firewall apps:\n\t${e}`);
  }

  osascript.executeFile(
    `${__dirname}/allowNetworkPermissionsXCUITest.scpt`,
    function(err, _, __) {
      if (err) {
        log.error(`[XCUITest] Failed to approve network permissions for XCUITest target:\n\t${err}`);
      } else {
        log.debug(`[XCUITest] Network permissions are allowed`);
      }

      callback();
    });
}

module.exports = {
  launchXCUITest
};
