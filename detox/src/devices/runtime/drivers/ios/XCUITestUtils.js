const { exec } = require('child-process-promise');
const osascript = require('node-osascript');

const { spawnAndLog } = require('../../../../utils/childProcess');
const { execWithRetriesAndLogs } = require('../../../../utils/childProcess');
const log = require('../../../../utils/logger').child({ cat: 'device,xcuitest' });

async function launchXCUITest(
  simulatorId,
  isHeadless,
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
    isHeadless,
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
  isHeadless,
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

  await buildXcodeProject();
  const spawnedProcess = runXCUITest(
    simulatorId, isHeadless, detoxServer, detoxSessionId, testTargetServerPort, bundleId, debugVisibility, disableDumpViewHierarchy
  ).then(r => {
    log.info(`[XCUITest] XCUITest runner execution finished`);
  }).catch(e => {
    log.error(`[XCUITest] xcodebuild error has occurred during XCUITest execution:\n${e.stderr}`);
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

async function buildXcodeProject() {
  log.debug(`[XCUITest] Building xcode project`);
  const cmd = `xcodebuild ` +
    `-workspace ../ios/DetoxTester.xcworkspace ` +
    `-scheme DetoxTester ` +
    `-sdk iphonesimulator ` +
    `-allowProvisioningUpdates ` +
    `build-for-testing`;

  const options = {
    retries: 10,
    prefix: null,
    args: null,
    timeout: 60000,
    statusLogs: {
      trying: 'Building the XCUITest runner...',
      successful: 'XCUITest runner built successfully!',
      retrying: 'Retrying the XCUITest runner build...',
    },
    verbosity: 'debug',
    maxBuffer: 1024 * 1024 * 1024,
  };

  try {
    log.debug(`[XCUITest] Running command: ${cmd}`);
    await execWithRetriesAndLogs(cmd, options);
  } catch (err) {
    log.error(`[XCUITest] Failed to build the project with command: ${cmd}, error:\n${err}`);
    throw err;
  }
}

function runXCUITest(
  simulatorId, isHeadless, detoxServer, detoxSessionId, testTargetServerPort, bundleId, debugVisibility, disableDumpViewHierarchy,
) {
  log.debug(`[XCUITest] Running xcodebuild test with bundle id: ${bundleId}`);
  let xcodebuildBinary = 'xcodebuild';
  const xcworkspace = '/Users/asafk/Development/Detox/detox/ios/DetoxTester.xcworkspace';
  const xcodebuildFlags = [
    '-workspace', xcworkspace,
    '-scheme', 'DetoxTester',
    '-sdk', 'iphonesimulator',
    '-allowProvisioningUpdates',
    '-destination', `platform=iOS Simulator,id=${simulatorId}`,
    'test-without-building'
  ];

  const xcodebuildEnvArgs = {
    TEST_RUNNER_IS_DETOX_ACTIVE: '1',
    TEST_RUNNER_DETOX_SERVER: detoxServer,
    TEST_RUNNER_DETOX_SESSION_ID: detoxSessionId,
    TEST_RUNNER_TEST_TARGET_SERVER_PORT: testTargetServerPort,
    TEST_RUNNER_BUNDLE_ID: bundleId,
    TEST_RUNNER_DETOX_DEBUG_VISIBILITY: debugVisibility,
    TEST_RUNNER_DETOX_DISABLE_VIEW_HIERARCHY_DUMP: disableDumpViewHierarchy
  };

  const options = {
    maxBuffer: 1024 * 1024 * 1024
  };

  return _spawnAndLog(xcodebuildBinary, xcodebuildFlags, xcodebuildEnvArgs, options, isHeadless);
}

function _spawnAndLog(xcodebuildBinary, xcodebuildFlags, xcodebuildEnvArgs, options, isHeadless) {
  if (isHeadless) {
    const newCommand = `${xcodebuildBinary} ${xcodebuildFlags.map(
      arg => arg.includes(' ') ? `\\"${arg}\\"` : arg
    ).join(' ')}`;

    // map xcodebuildEnvArgs object to a string of the form `key1='value1' key2='value2'`
    const envArgs = Object.keys(xcodebuildEnvArgs).map(
      key => `${key}='${xcodebuildEnvArgs[key]}'`
    ).join(' ');

    const newCommandWithEnv = `${envArgs} ${newCommand}`;

    const osascriptFile = `${__dirname}/run_and_close_terminal.scpt`;

    log.debug(`[XCUITest] Executing ${newCommandWithEnv}`);

    return exec(`osascript ${osascriptFile} "${newCommandWithEnv}"`);
  } else {
    return spawnAndLog('xcodebuild', xcodebuildFlags, {
      env: { xcodebuildEnvArgs, ...process.env },
      ...options
    });
  }
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
    if (didCallback) {
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

    if (cpPromise.childProcess.kill('SIGTERM')) {
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
