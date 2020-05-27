const _ = require('lodash');
const path = require('path');
const cp = require('child_process');
const fs = require('fs-extra');
const environment = require('../src/utils/environment');
const DetoxRuntimeError = require('../src/errors/DetoxRuntimeError');

const log = require('../src/utils/logger').child({ __filename });
const shellQuote = require('./utils/shellQuote');
const { composeDetoxConfig } = require('../src/configuration');

module.exports.command = 'test';
module.exports.desc = 'Run your test suite with the test runner specified in package.json';
module.exports.builder = {
  C: {
    alias: 'config-path',
    group: 'Configuration:',
    describe: 'Specify Detox config file path. If not supplied, detox searches for .detoxrc[.js] or "detox" section in package.json',
  },
  c: {
    alias: ['configuration'],
    group: 'Configuration:',
    describe:
      'Select a device configuration from your defined configurations, if not supplied, and there\'s only one configuration, detox will default to it'
  },
  o: {
    alias: 'runner-config',
    group: 'Configuration:',
    describe: 'Test runner config file, defaults to e2e/mocha.opts for mocha and e2e/config.json for jest',
  },
  l: {
    alias: 'loglevel',
    group: 'Debugging:',
    choices: ['fatal', 'error', 'warn', 'info', 'verbose', 'trace'],
    describe: 'Log level'
  },
  'no-color': {
    describe: 'Disable colors in log output',
    boolean: true,
  },
  r: {
    alias: 'reuse',
    group: 'Execution:',
    describe: 'Reuse existing installed app (do not delete + reinstall) for a faster run.'
  },
  u: {
    alias: 'cleanup',
    group: 'Execution:',
    describe: 'Shutdown simulator when test is over, useful for CI scripts, to make sure detox exists cleanly with no residue'
  },
  d: {
    alias: 'debug-synchronization',
    group: 'Debugging:',
    coerce(value) {
      if (value == null) {
        return undefined;
      }

      if (value === true || value === 'true') {
        return 3000;
      }

      return Number(value);
    },
    describe:
      'When an action/expectation takes a significant amount of time use this option to print device synchronization status.' +
      'The status will be printed if the action takes more than [value]ms to complete'
  },
  a: {
    alias: 'artifacts-location',
    group: 'Debugging:',
    describe: 'Artifacts (logs, screenshots, etc) root directory.'
  },
  'record-logs': {
    group: 'Debugging:',
    choices: ['failing', 'all', 'none'],
    describe: 'Save logs during each test to artifacts directory. Pass "failing" to save logs of failing tests only.'
  },
  'take-screenshots': {
    group: 'Debugging:',
    choices: ['manual', 'failing', 'all', 'none'],
    describe: 'Save screenshots before and after each test to artifacts directory. Pass "failing" to save screenshots of failing tests only.'
  },
  'record-videos': {
    group: 'Debugging:',
    choices: ['failing', 'all', 'none'],
    describe: 'Save screen recordings of each test to artifacts directory. Pass "failing" to save recordings of failing tests only.'
  },
  'record-performance': {
    group: 'Debugging:',
    choices: ['all', 'none'],
    describe: '[iOS Only] Save Detox Instruments performance recordings of each test to artifacts directory.'
  },
  'record-timeline': {
    group: 'Debugging:',
    choices: ['all', 'none'],
    describe: '[Jest Only] Record tests and events timeline, for visual display on the chrome://tracing tool.'
  },
  w: {
    alias: 'workers',
    group: 'Execution:',
    describe:
      '[iOS Only] Specifies the number of workers the test runner should spawn, requires a test runner with parallel execution support (Detox CLI currently supports Jest)',
    string: true,
    default: '1'
  },
  'jest-report-specs': {
    group: 'Execution:',
    describe: '[Jest Only] Whether to output logs per each running spec, in real-time. By default, disabled with multiple workers.',
  },
  H: {
    alias: 'headless',
    group: 'Execution:',
    describe: '[Android Only] Launch emulator in headless mode. Useful when running on CI.'
  },
  gpu: {
    group: 'Execution:',
    describe: '[Android Only] Launch emulator with the specific -gpu [gpu mode] parameter.'
  },
  keepLockFile:{
    group: 'Configuration:',
    describe:'Keep the device lock file when running Detox tests'
  },
  n: {
    alias: 'device-name',
    group: 'Configuration:',
    describe: 'Override the device name specified in a configuration. Useful for running a single build configuration on multiple devices.'
  },
  'device-launch-args': {
    group: 'Execution:',
    describe: 'Custom arguments to pass (through) onto the device (emulator/simulator) binary when launched.'
  },
  'use-custom-logger': {
    boolean: true,
    default: true,
    group: 'Execution:',
    describe: `Use Detox' custom console-logging implementation, for logging Detox (non-device) logs. Disabling will fallback to node.js / test-runner's implementation (e.g. Jest / Mocha).`,
  },
  'force-adb-install': {
    boolean: true,
    default: false,
    group: 'Execution:',
    describe: `Due to problems with the "adb install" command on Android, Detox resorts to a different scheme for install APK's. Setting true will disable that and force usage of "adb install", instead.`,
  },
};

const collectExtraArgs = require('./utils/collectExtraArgs')(module.exports.builder);

module.exports.handler = async function test(program) {
  const { cliConfig, deviceConfig, runnerConfig } = await composeDetoxConfig({ argv: program });
  const [ platform ] = deviceConfig.type.split('.');

  if (!cliConfig.keepLockFile) {
    clearDeviceRegistryLockFile();
  }

  function run() {
    if (runnerConfig.testRunner.includes('jest')) {
      return runJest();
    }

    if (runnerConfig.testRunner.includes('mocha')) {
      return runMocha();
    }

    throw new DetoxRuntimeError({
      message: `"${runnerConfig.testRunner}" is not supported in Detox CLI tools.`,
      hint: `You can still run your tests with the runner's own CLI tool`,
    });
  }

  function getPassthroughArguments() {
    const args = collectExtraArgs(process.argv.slice(3));

    const hasFolders = args.some(arg => arg && !arg.startsWith('-'));
    return hasFolders ? args : [...args, runnerConfig.specs];
  }

  function safeGuardArguments(args) {
    if (_.last(args).includes(' ')) {
      return args;
    }

    const safeArg = _.findLast(args, a => a.includes(' '));
    if (!safeArg) {
      return args;
    }

    return [..._.pull(args, safeArg), safeArg]
  }

  function runMocha() {
    if (cliConfig.workers != 1) {
      log.warn('Can not use -w, --workers. Parallel test execution is only supported with iOS and Jest');
    }

    const configParam = path.extname(runnerConfig.runnerConfig) === '.opts'
      ? 'opts'
      : 'config';

    const command = _.compact([
      (path.join('node_modules', '.bin', runnerConfig.testRunner)),
      ...safeGuardArguments([
        (runnerConfig.runnerConfig ? `--${configParam} ${runnerConfig.runnerConfig}` : ''),
        (cliConfig.configPath ? `--config-path ${cliConfig.configPath}` : ''),
        (cliConfig.configuration ? `--configuration ${cliConfig.configuration}` : ''),
        (cliConfig.loglevel ? `--loglevel ${cliConfig.loglevel}` : ''),
        (cliConfig.noColor ? '--no-colors' : ''),
        (cliConfig.cleanup ? `--cleanup` : ''),
        (cliConfig.reuse ? `--reuse` : ''),
        (isFinite(cliConfig.debugSynchronization) ? `--debug-synchronization ${cliConfig.debugSynchronization}` : ''),
        (platform ? `--invert --grep ${getPlatformSpecificString()}` : ''),
        (cliConfig.headless ? `--headless` : ''),
        (cliConfig.gpu ? `--gpu ${cliConfig.gpu}` : ''),
        (cliConfig.recordLogs ? `--record-logs ${cliConfig.recordLogs}` : ''),
        (cliConfig.takeScreenshots ? `--take-screenshots ${cliConfig.takeScreenshots}` : ''),
        (cliConfig.recordVideos ? `--record-videos ${cliConfig.recordVideos}` : ''),
        (cliConfig.recordPerformance ? `--record-performance ${cliConfig.recordPerformance}` : ''),
        (cliConfig.artifactsLocation ? `--artifacts-location "${cliConfig.artifactsLocation}"` : ''),
        (cliConfig.deviceName ? `--device-name "${cliConfig.deviceName}"` : ''),
        (cliConfig.useCustomLogger ? `--use-custom-logger "${cliConfig.useCustomLogger}"` : ''),
        (cliConfig.forceAdbInstall ? `--force-adb-install "${cliConfig.forceAdbInstall}"` : ''),
      ]),
      ...getPassthroughArguments(),
    ]).join(' ');

    const detoxEnvironmentVariables = _.pick(cliConfig, [
      'deviceLaunchArgs',
    ]);

    launchTestRunner(command, detoxEnvironmentVariables);
  }

  function runJest() {
    const hasMultipleWorkers = cliConfig.workers != 1;

    if (platform === 'android') {
      cliConfig.readOnlyEmu = false;
      if (hasMultipleWorkers) {
        cliConfig.readOnlyEmu = true;
        log.warn('Multiple workers is an experimental feature on Android and requires an emulator binary of version 28.0.16 or higher. ' +
          'Check your version by running: $ANDROID_HOME/tools/bin/sdkmanager --list');
      }
    }

    const jestReportSpecsArg = cliConfig.jestReportSpecs;
    if (!_.isUndefined(jestReportSpecsArg)) {
      cliConfig.reportSpecs = `${jestReportSpecsArg}` === 'true';
    } else {
      cliConfig.reportSpecs = !hasMultipleWorkers;
    }

    const command = _.compact([
      path.join('node_modules', '.bin', runnerConfig.testRunner),
      ...safeGuardArguments([
        cliConfig.noColor ? ' --no-color' : '',
        runnerConfig.runnerConfig ? `--config ${runnerConfig.runnerConfig}` : '',
        platform ? shellQuote(`--testNamePattern=^((?!${getPlatformSpecificString()}).)*$`) : '',
        `--maxWorkers ${cliConfig.workers}`,
      ]),
      ...getPassthroughArguments(),
    ]).join(' ');

    const detoxEnvironmentVariables = {
      ..._.pick(cliConfig, [
        'configPath',
        'configuration',
        'loglevel',
        'cleanup',
        'reuse',
        'debugSynchronization',
        'gpu',
        'headless',
        'artifactsLocation',
        'recordLogs',
        'takeScreenshots',
        'recordVideos',
        'recordPerformance',
        'recordTimeline',
        'deviceName',
        'reportSpecs',
        'readOnlyEmu',
        'deviceLaunchArgs',
        'useCustomLogger',
        'forceAdbInstall',
      ]),
      DETOX_START_TIMESTAMP: Date.now(),
    };

    launchTestRunner(command, detoxEnvironmentVariables);
  }

  function printEnvironmentVariables(envObject) {
    return Object.entries(envObject).reduce((cli, [key, value]) => {
      if (value == null || value === '') {
        return cli;
      }

      return `${cli}${key}=${JSON.stringify(value)} `;
    }, '');
  }

  function getPlatformSpecificString() {
    let platformRevertString;
    if (platform === 'ios') {
      platformRevertString = ':android:';
    } else if (platform === 'android') {
      platformRevertString = ':ios:';
    }

    return platformRevertString;
  }

  function clearDeviceRegistryLockFile() {
    const lockFilePath = platform === 'ios' ? environment.getDeviceLockFilePathIOS() : environment.getDeviceLockFilePathAndroid();
    fs.ensureFileSync(lockFilePath);
    fs.writeFileSync(lockFilePath, '[]');
  }

  function launchTestRunner(command, detoxEnvironmentVariables) {
    log.info(printEnvironmentVariables(detoxEnvironmentVariables) + command);
    cp.execSync(command, {
      stdio: 'inherit',
      env: {
        ...process.env,
        ...detoxEnvironmentVariables
      }
    });
  }

  run();
};
