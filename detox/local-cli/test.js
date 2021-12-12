const cp = require('child_process');
const path = require('path');

const _ = require('lodash');
const whichSync = require('which').sync;
const unparse = require('yargs-unparser');

const { composeDetoxConfig } = require('../src/configuration');
const DeviceRegistry = require('../src/devices/DeviceRegistry');
const GenyDeviceRegistryFactory = require('../src/devices/allocation/drivers/android/genycloud/GenyDeviceRegistryFactory');
const DetoxRuntimeError = require('../src/errors/DetoxRuntimeError');
const { loadLastFailedTests, resetLastFailedTests } = require('../src/utils/lastFailedTests');
const log = require('../src/utils/logger').child({ __filename });
const { parse, quote } = require('../src/utils/shellQuote');

const { readJestConfig } = require('./utils/jestInternals');
const { getPlatformSpecificString, printEnvironmentVariables } = require('./utils/misc');
const { prependNodeModulesBinToPATH } = require('./utils/misc');
const splitArgv = require('./utils/splitArgv');
const { DETOX_ARGV_OVERRIDE_NOTICE, DEVICE_LAUNCH_ARGS_DEPRECATION } = require('./utils/warnings');

module.exports.command = 'test';
module.exports.desc = 'Run your test suite with the test runner specified in package.json';
module.exports.builder = require('./utils/testCommandArgs');
module.exports.handler = async function test(argv) {
  const { detoxArgs, runnerArgs } = splitArgv.detox(argv);
  const { cliConfig, deviceConfig, runnerConfig } = await composeDetoxConfig({ argv: detoxArgs });
  const [platform] = deviceConfig.type.split('.');
  const runner = deduceTestRunner(runnerConfig.testRunner);

  const prepareArgs = choosePrepareArgs({
    cliConfig,
    runner,
    detoxArgs,
  });

  const forwardedArgs = await prepareArgs({
    cliConfig,
    deviceConfig,
    runnerConfig,
    runnerArgs,
    platform,
  });

  if (detoxArgs['inspect-brk']) {
    const runnerBinary = whichSync(runner, {
      path: prependNodeModulesBinToPATH({ ...process.env }),
    });

    forwardedArgs.argv.$0 = `node --inspect-brk ${require.resolve(runnerBinary)}`;
  } else {
    forwardedArgs.argv.$0 = runnerConfig.testRunner;
  }

  const retries = runner === 'jest' ? detoxArgs.retries : 0;
  await runTestRunnerWithRetries(forwardedArgs, {
    keepLockFile: cliConfig.keepLockFile,
    platform,
    retries,
  });
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
  },

  function warnDeviceAppLaunchArgsDeprecation(argv) {
    if (argv['device-boot-args'] && process.argv.some(a => a.startsWith('--device-launch-args'))) {
      log.warn(DEVICE_LAUNCH_ARGS_DEPRECATION);
    }

    return argv;
  }
];

function choosePrepareArgs({ cliConfig, detoxArgs, runner }) {
  if (runner === 'mocha') {
    if (cliConfig.workers) {
      log.warn('Cannot use -w, --workers. Parallel test execution is only supported with Jest');
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
      'capture-view-hierarchy': cliConfig.captureViewHierarchy || undefined,
      'use-custom-logger': cliConfig.useCustomLogger && 'true' || undefined,

      ...passthrough,
    },
    env: _.omitBy({
      DETOX_APP_LAUNCH_ARGS: cliConfig.appLaunchArgs,
      DETOX_DEVICE_BOOT_ARGS: cliConfig.deviceBootArgs,
    }, _.isUndefined),
    specs: _.isEmpty(specs) ? [runnerConfig.specs] : specs,
  };
}

async function prepareJestArgs({ cliConfig, deviceConfig, runnerArgs, runnerConfig, platform }) {
  const { specs, passthrough } = splitArgv.jest(runnerArgs);
  const platformFilter = getPlatformSpecificString(platform);

  const argv = _.omitBy({
    color: !cliConfig.noColor && undefined,
    config: runnerConfig.runnerConfig /* istanbul ignore next */ || undefined,
    testNamePattern: platformFilter ? `^((?!${platformFilter}).)*$` : undefined,
    maxWorkers: cliConfig.workers || (runnerConfig.skipLegacyWorkersInjection ? undefined : 1),

    ...passthrough,
  }, _.isUndefined);

  const hasMultipleWorkers = runnerConfig.skipLegacyWorkersInjection
    ? (await readJestConfig(argv)).globalConfig.maxWorkers > 1
    : cliConfig.workers > 1;

  return {
    argv,

    env: _.omitBy({
      DETOX_APP_LAUNCH_ARGS: cliConfig.appLaunchArgs,
      DETOX_ARTIFACTS_LOCATION: cliConfig.artifactsLocation,
      DETOX_CAPTURE_VIEW_HIERARCHY: cliConfig.captureViewHierarchy,
      DETOX_CLEANUP: cliConfig.cleanup,
      DETOX_CONFIGURATION: cliConfig.configuration,
      DETOX_CONFIG_PATH: cliConfig.configPath,
      DETOX_DEBUG_SYNCHRONIZATION: cliConfig.debugSynchronization,
      DETOX_DEVICE_BOOT_ARGS: cliConfig.deviceBootArgs,
      DETOX_DEVICE_NAME: cliConfig.deviceName,
      DETOX_FORCE_ADB_INSTALL: platform === 'android' ? cliConfig.forceAdbInstall : undefined,
      DETOX_GPU: cliConfig.gpu,
      DETOX_HEADLESS: cliConfig.headless,
      DETOX_LOGLEVEL: cliConfig.loglevel,
      DETOX_READ_ONLY_EMU: deviceConfig.type === 'android.emulator' && hasMultipleWorkers ? true : undefined,
      DETOX_RECORD_LOGS: cliConfig.recordLogs,
      DETOX_RECORD_PERFORMANCE: cliConfig.recordPerformance,
      DETOX_RECORD_TIMELINE: cliConfig.recordTimeline,
      DETOX_RECORD_VIDEOS: cliConfig.recordVideos,
      DETOX_REPORT_SPECS: _.isUndefined(cliConfig.jestReportSpecs)
        ? !hasMultipleWorkers
        : `${cliConfig.jestReportSpecs}` === 'true',
      DETOX_REUSE: cliConfig.reuse,
      DETOX_START_TIMESTAMP: Date.now(),
      DETOX_TAKE_SCREENSHOTS: cliConfig.takeScreenshots,
      DETOX_USE_CUSTOM_LOGGER: cliConfig.useCustomLogger,
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
    await GenyDeviceRegistryFactory.forGlobalShutdown().reset();
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

async function runTestRunnerWithRetries(forwardedArgs, { keepLockFile, platform, retries }) {
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

      if (!keepLockFile) {
        await resetLockFile({ platform });
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
