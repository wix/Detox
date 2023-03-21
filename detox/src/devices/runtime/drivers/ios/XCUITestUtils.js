const { exec } = require('child-process-promise');
const osascript = require('node-osascript');

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

  await _runLaunchCommand(
    simulatorId,
    detoxServer,
    detoxSessionId,
    bundleId,
    debugVisibility,
    disableDumpViewHierarchy,
    testTargetServerPort
  );

  log.debug('[XCUITest] Launch succeeded');
}

async function _runLaunchCommand(
  simulatorId,
  detoxServer,
  detoxSessionId,
  bundleId,
  debugVisibility,
  disableDumpViewHierarchy,
  testTargetServerPort
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

  // Get firewall global state (Firewall socketfilterfw):
  const state = await exec(`/usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate`);
  const isFirewallOn = state.stdout.toString().trim() !== 'Firewall is off.';
  if (isFirewallOn) {
    _allowNetworkPermissionsXCUITest();
  }

  await _waitForTestTargetServerToStart(testTargetServerPort);
}

function _allowNetworkPermissionsXCUITest() {
  log.debug(`[XCUITest] Allowing network permissions`);
  let didCallback = false;

  const childProcess = osascript.executeFile(
    `${__dirname}/allowNetworkPermissionsXCUITest.scpt`,
    function(err, _, __) {
      if (err) {
        log.error(`[XCUITest] Failed to approve network permissions for XCUITest target:\n\t${err}`);
      } else {
        log.debug(`[XCUITest] Network permissions are allowed`);
      }

      didCallback = true;
    });

  // After 10 seconds, kill the process:
  setTimeout(() => {
    if (didCallback) {
      return;
    }

    log.debug(`[XCUITest] Killing the process that allows network permissions (timed-out)`);
    childProcess.stdin.pause();
    childProcess.kill();

  }, 10000);
}

async function _waitForTestTargetServerToStart(testTargetServerPort) {
  log.debug(`[XCUITest] Waiting for test target server to start on port ${testTargetServerPort}...`);
  let isServerUp = false;
  while (!isServerUp) {
    try {
      await exec(`nc -z localhost ${testTargetServerPort}`);
      isServerUp = true;
    } catch (e) {
      log.debug(`[XCUITest] Test target server is not up yet, waiting...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  log.debug(`[XCUITest] Test target server is up and running`);
}

module.exports = {
  launchXCUITest
};
