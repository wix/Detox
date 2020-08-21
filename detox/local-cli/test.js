const _ = require('lodash');
const path = require('path');
const cp = require('child_process');
const DeviceRegistry = require('../src/devices/DeviceRegistry');
const DetoxRuntimeError = require('../src/errors/DetoxRuntimeError');

const log = require('../src/utils/logger').child({ __filename });
const shellQuote = require('./utils/shellQuote');
const { composeDetoxConfig } = require('../src/configuration');

module.exports.command = 'test';
module.exports.desc = 'Run your test suite with the test runner specified in package.json';
module.exports.builder = require('./utils/testCommandArgs');

const collectExtraArgs = require('./utils/collectExtraArgs')(module.exports.builder);

module.exports.handler = async function test(program) {
  const { cliConfig, deviceConfig, runnerConfig } = await composeDetoxConfig({ argv: program });
  const [ platform ] = deviceConfig.type.split('.');

  if (!cliConfig.keepLockFile) {
    await clearDeviceRegistryLockFile();
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
      cliConfig.inspectBrk ? 'node --inspect-brk' : '',
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
      cliConfig.inspectBrk ? 'node --inspect-brk' : '',
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

  async function clearDeviceRegistryLockFile() {
    if (platform === 'ios') {
      await DeviceRegistry.forIOS().reset();
    }

    if (platform === 'android') {
      await DeviceRegistry.forAndroid().reset();
    }
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
