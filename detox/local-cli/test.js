const _ = require('lodash');
const cp = require('child_process');
const path = require('path');
const unparse = require('yargs-unparser');
const { parse, quote } = require('./utils/shellQuote');
const splitArgv = require('./utils/splitArgv');
const DetoxRuntimeError = require('../src/errors/DetoxRuntimeError');
const DeviceRegistry = require('../src/devices/DeviceRegistry');
const environment = require('../src/utils/environment');
const { loadLastFailedTests, resetLastFailedTests } = require('../src/utils/lastFailedTests');
const { composeDetoxConfig } = require('../src/configuration');
const log = require('../src/utils/logger').child({ __filename });
const { getPlatformSpecificString, printEnvironmentVariables } = require('./utils/misc');
const { prependNodeModulesBinToPATH } = require('./utils/misc');
const { DETOX_ARGV_OVERRIDE_NOTICE } = require('./utils/warnings');

module.exports.command = 'test';
module.exports.desc = 'Run your test suite with the test runner specified in package.json';
module.exports.builder = require('./utils/testCommandArgs');
module.exports.handler = async function test(argv) {
  const { detoxArgs, runnerArgs } = splitArgv.detox(argv);
  const { cliConfig, deviceConfig, runnerConfig } = await composeDetoxConfig({ argv: detoxArgs });
  const [ platform ] = deviceConfig.type.split('.');
  const runner = deduceTestRunner(runnerConfig.testRunner);

  const prepareArgs = choosePrepareArgs({
    cliConfig,
    runner,
    detoxArgs,
  });

  const forwardedArgs = prepareArgs({
    cliConfig,
    runnerConfig,
    runnerArgs,
    platform,
  });

  if (detoxArgs['inspect-brk']) {
    forwardedArgs.argv.$0 = `node --inspect-brk ${runnerConfig.testRunner}`;
  } else {
    forwardedArgs.argv.$0 = runnerConfig.testRunner;
  }

  if (!cliConfig.keepLockFile) {
    await resetLockFile({ platform });
  }

  const retries = runner === 'jest' ? detoxArgs.retries : 0;
  await runTestRunnerWithRetries(forwardedArgs, retries);
};

module.exports.middlewares = [
  function applyEnvironmentVariableAddendum(argv, yargs) {
    if (process.env.DETOX_ARGV_OVERRIDE) {
      log.warn(DETOX_ARGV_OVERRIDE_NOTICE);

      return yargs.parse([
        ...process.argv.slice(2),
        ...parse(process.env.DETOX_ARGV_OVERRIDE),
      ]);
    }

    return argv;
  }
];

function choosePrepareArgs({ cliConfig, detoxArgs, runner }) {
  if (runner === 'mocha') {
    if (hasMultipleWorkers(cliConfig)) {
      log.warn('Cannot use -w, --workers. Parallel test execution is only supported with iOS and Jest');
    }

    if (detoxArgs.retries > 0) {
      log.warn('Cannot use -R, --retries. The test retry mechanism is only supported with Jest runner');
    }

    if (cliConfig.recordTimeline) {
      log.warn('Cannot use --record-timeline. This artifact type is only supported with Jest runner');
    }

    return prepareMochaArgs;
  }

  if (runner === 'jest') {
    return prepareJestArgs;
  }

  throw new DetoxRuntimeError({
    message: `"${runner}" is not supported in Detox CLI tools.`,
    hint: `You can still run your tests with the runner's own CLI tool`
  });
}

function deduceTestRunner(command) {
  if (command.includes('mocha')) {
    return 'mocha';
  }

  if (command.includes('jest')) {
    return 'jest';
  }

  return command;
}

function prepareMochaArgs({ cliConfig, runnerArgs, runnerConfig, platform }) {
  const { specs, passthrough } = splitArgv.mocha(runnerArgs);
  const configParam = path.extname(runnerConfig.runnerConfig) === '.opts'
    ? 'opts'
    : 'config';

  const platformFilter = getPlatformSpecificString(platform);

  return {
    argv: {
      [configParam]: runnerConfig.runnerConfig /* istanbul ignore next */ || undefined,
      cleanup: Boolean(cliConfig.cleanup) || undefined,
      colors: !cliConfig.noColor && undefined,
      configuration: cliConfig.configuration || undefined,
      gpu: cliConfig.gpu || undefined,
      // TODO: check if we can --grep from user
      grep: platformFilter || undefined,
      invert: Boolean(platformFilter) || undefined,
      headless: Boolean(cliConfig.headless) || undefined,
      loglevel: cliConfig.loglevel || undefined,
      reuse: cliConfig.reuse || undefined,
      'artifacts-location': cliConfig.artifactsLocation || undefined,
      'config-path': cliConfig.configPath /* istanbul ignore next */ || undefined,
      'debug-synchronization': isFinite(cliConfig.debugSynchronization) ? cliConfig.debugSynchronization : undefined,
      'device-name': cliConfig.deviceName || undefined,
      'force-adb-install': platform === 'android' && cliConfig.forceAdbInstall || undefined,
      'record-logs': cliConfig.recordLogs || undefined,
      'record-performance': cliConfig.recordPerformance || undefined,
      'record-videos': cliConfig.recordVideos || undefined,
      'take-screenshots': cliConfig.takeScreenshots || undefined,
      'use-custom-logger': cliConfig.useCustomLogger && 'true' || undefined,

      ...passthrough,
    },
    env: _.pick(cliConfig, ['appLaunchArgs', 'deviceLaunchArgs']),
    specs: _.isEmpty(specs) ? [runnerConfig.specs] : specs,
  };
}

function prepareJestArgs({ cliConfig, runnerArgs, runnerConfig, platform }) {
  const { specs, passthrough } = splitArgv.jest(runnerArgs);
  const platformFilter = getPlatformSpecificString(platform);

  return {
    argv: {
      color: !cliConfig.noColor && undefined,
      config: runnerConfig.runnerConfig /* istanbul ignore next */ || undefined,
      testNamePattern: platformFilter ? `^((?!${platformFilter}).)*$` : undefined,
      maxWorkers: cliConfig.workers,

      ...passthrough,
    },

    env: _.omitBy({
      ..._.pick(cliConfig, _.compact([
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
        'deviceLaunchArgs',
        'appLaunchArgs',
        'useCustomLogger',
        platform === 'android' && 'forceAdbInstall',
      ])),
      DETOX_START_TIMESTAMP: Date.now(),
      readOnlyEmu: platform === 'android' ? hasMultipleWorkers(cliConfig) : undefined,
      reportSpecs: _.isUndefined(cliConfig.jestReportSpecs)
        ? !hasMultipleWorkers(cliConfig)
        : `${cliConfig.jestReportSpecs}` === 'true',
    }, _.isUndefined),

    specs: _.isEmpty(specs) ? [runnerConfig.specs] : specs,
  };
}

async function resetLockFile({ platform }) {
  if (platform === 'ios') {
    await DeviceRegistry.forIOS().reset();
  }

  if (platform === 'android') {
    await DeviceRegistry.forAndroid().reset();
    await DeviceRegistry.forGenyCloudCleanup().reset();
  }
}

function launchTestRunner({ argv, env, specs }) {
  const { $0: command, ...restArgv } = argv;
  const fullCommand = [
    command,
    quote(unparse(_.omitBy(restArgv, _.isUndefined))),
    specs.join(' ')
  ].join(' ');

  log.info(printEnvironmentVariables(env) + fullCommand);

  cp.execSync(fullCommand, {
    stdio: 'inherit',
    env: _({})
      .assign(process.env)
      .assign(env)
      .omitBy(_.isUndefined)
      .tap(prependNodeModulesBinToPATH)
      .value()
  });
}

function hasMultipleWorkers(cliConfig) {
  return cliConfig.workers != 1;
}

async function runTestRunnerWithRetries(forwardedArgs, retries) {
  let runsLeft = 1 + retries;
  let launchError;

  do {
    try {
      if (launchError) {
        const list = forwardedArgs.specs.map((file, index) => `  ${index + 1}. ${file}`).join('\n');
        log.error(
          `There were failing tests in the following files:\n${list}\n\n` +
          'Detox CLI is going to restart the test runner with those files...\n'
        );
      }

      await resetLastFailedTests();
      launchTestRunner(forwardedArgs);
      launchError = null;
    } catch (e) {
      launchError = e;

      const lastFailedTests = await loadLastFailedTests();
      if (_.isEmpty(lastFailedTests)) {
        throw e;
      }

      forwardedArgs.specs = lastFailedTests;
      forwardedArgs.env.DETOX_RERUN_INDEX = 1 + (forwardedArgs.env.DETOX_RERUN_INDEX || 0);
    }
  } while (launchError && --runsLeft > 0);

  if (launchError) {
    throw launchError;
  }
}
