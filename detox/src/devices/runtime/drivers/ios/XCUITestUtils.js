const { exec } = require('child-process-promise');
const osascript = require('node-osascript');

const { execWithRetriesAndLogs } = require('../../../../utils/childProcess');
const log = require('../../../../utils/logger').child({ cat: 'device,xcuitest' });

async function launchXCUITest(
  xcuitestRunnerPath,
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
    xcuitestRunnerPath,
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
  xcuitestRunnerPath,
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

  const spawnedProcess = runXCUITest(
    xcuitestRunnerPath,
    simulatorId,
    detoxServer,
    detoxSessionId,
    testTargetServerPort,
    bundleId,
    debugVisibility,
    disableDumpViewHierarchy
  ).then(r => {
    log.info(`[XCUITest] XCUITest runner execution finished`);
  }).catch(e => {
    log.error(`[XCUITest] xcodebuild error has occurred during XCUITest execution:\n${e}`);
  });

  // Get firewall global state (Firewall socketfilterfw):
  const state = await exec(`/usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate`);
  const isFirewallDisabled = state.stdout.toString().includes('Firewall is disabled');
  if (!isFirewallDisabled) {
    _allowNetworkPermissionsXCUITest();
  }

  const isServerUp = await _waitForTestTargetServerToStart(testTargetServerPort, spawnedProcess);
  log.debug(`[XCUITest] Finished waiting for test target server to start, server is up: ${isServerUp}`);
}

function runXCUITest(
  xcuitestRunnerPath,
  simulatorId,
  detoxServer,
  detoxSessionId,
  testTargetServerPort,
  bundleId,
  debugVisibility,
  disableDumpViewHierarchy,
) {
  log.debug(`[XCUITest] Running xcodebuild test with bundle id: ${bundleId}`);
  let xcodebuildBinary = 'xcodebuild';
  const flags = [
    '-xctestrun', xcuitestRunnerPath,
    '-sdk', 'iphonesimulator',
    '-allowProvisioningUpdates',
    '-destination', `platform=iOS Simulator,id=${simulatorId}`,
    'test-without-building'
  ];

  const env = {
    TEST_RUNNER_IS_DETOX_ACTIVE: '1',
    TEST_RUNNER_DETOX_SERVER: detoxServer,
    TEST_RUNNER_DETOX_SESSION_ID: detoxSessionId,
    TEST_RUNNER_TEST_TARGET_SERVER_PORT: testTargetServerPort,
    TEST_RUNNER_BUNDLE_ID: bundleId,
    TEST_RUNNER_DETOX_DEBUG_VISIBILITY: debugVisibility,
    TEST_RUNNER_DETOX_DISABLE_VIEW_HIERARCHY_DUMP: disableDumpViewHierarchy
  };

  const options = {
    maxBuffer: 1024 * 1024 * 1024,
    retries: 1,
    verbosity: 'high',
  };

  const command = `${env.TEST_RUNNER_IS_DETOX_ACTIVE ? Object.keys(env).map(key => `${key}=${env[key]}`).join(' ') : ''} ${xcodebuildBinary} ${flags.map(flag => flag.includes(' ') ? `"${flag}"` : flag).join(' ')}`;
  log.debug(`[XCUITest] Running command: ${command}`);

  // TODO: consider using this instead of the Terminal approach below.
  // const isRunningOnTerminal = process.stdout.isTTY;
  // if (isRunningOnTerminal === true) {
  //   return execWithRetriesAndLogs(command, options);
  // }
  //
  // log.info(`[XCUITest] Currently not running through the Terminal, will run the xcodebuild command on the Terminal`);
  return _runCommandInTerminal(command, options);
}

function _runCommandInTerminal(command, options) {
  const escapedCommand = command.replace(/"/g, '\\"'); // escape double quotes

  // opens the Terminal app and runs the command in a new window, then closes the window when the command is done running.
  const appleScript = `
        tell application "Terminal"
            if not running then
                open
            end if

            activate
            do script "${escapedCommand}; exit"

            repeat
                delay 1
                if not busy of window 1 then
                    close window 1
                    exit repeat
                end if
            end repeat
        end tell
    `;

  return execWithRetriesAndLogs(`osascript -e '${appleScript}'`, options);
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

  setTimeout(() => {
    if (didCallback || !childProcess) {
      return;
    }

    log.debug(`[XCUITest] Killing the process that allows network permissions (timed-out)`);
    childProcess.stdin.pause();
    childProcess.kill('SIGTERM');

  }, 30000);
}

async function _waitForTestTargetServerToStart(testTargetServerPort, cpPromise) {
  log.debug(`[XCUITest] Waiting for test target server to start on port ${testTargetServerPort}...`);
  let isServerUp = false;
  let retries = 0;

  while (!isServerUp && retries++ < 90) {
    try {
      await exec(`nc -z localhost ${testTargetServerPort}`);
      isServerUp = true;
    } catch (e) {
      log.debug(`[XCUITest] Test target server is not up yet, waiting...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  if (!isServerUp) {
    log.error(`[XCUITest] Test target server is not up after 90 seconds, aborting`);

    if (cpPromise && cpPromise.childProcess && cpPromise.childProcess.kill('SIGTERM')) {
      log.debug(`[XCUITest] Test target process was killed`);
    } else {
      log.debug(`[XCUITest] Test target process was not killed`);
    }

    return false;
  }

  log.debug(`[XCUITest] Test target server is up and running`);
  return true;
}

module.exports = {
  launchXCUITest
};
