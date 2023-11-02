const cp = require('child_process');

const _ = require('lodash');
const parser = require('yargs-parser');
const unparse = require('yargs-unparser');

const detox = require('../../internals');
const log = detox.log.child({ cat: ['lifecycle', 'cli'] });
const { printEnvironmentVariables, prependNodeModulesBinToPATH } = require('../../src/utils/envUtils');
const { toSimplePath } = require('../../src/utils/pathUtils');
const { escapeSpaces, useForwardSlashes } = require('../../src/utils/shellUtils');
const sleep = require('../../src/utils/sleep');
const AppStartCommand = require('../startCommand/AppStartCommand');
const { markErrorAsLogged } = require('../utils/cliErrorHandling');
const interruptListeners = require('../utils/interruptListeners');

const TestRunnerError = require('./TestRunnerError');

class TestRunnerCommand {
  /*
    @param {object} opts
    @param {DetoxInternals.RuntimeConfig} opts.config
    @param {ProcessEnv} opts.env
  */
  constructor(opts) {
    const cliConfig = opts.config.cli;
    const deviceConfig = opts.config.device;
    const runnerConfig = opts.config.testRunner;
    const appsConfig = opts.config.apps;

    this._argv = runnerConfig.args;
    this._detached = runnerConfig.detached;
    this._retries = runnerConfig.retries;
    this._envHint = this._buildEnvHint(opts.env);
    this._startCommands = this._prepareStartCommands(appsConfig, cliConfig);
    this._envFwd = {};
    this._terminating = false;

    if (runnerConfig.forwardEnv) {
      this._envFwd = this._buildEnvOverride(cliConfig, deviceConfig);
      Object.assign(this._envHint, this._envFwd);
    }
  }

  async execute() {
    let runsLeft = 1 + this._retries;
    let launchError = null;

    if (this._startCommands.length > 0) {
      try {
        await Promise.race([sleep(1000), ...this._startCommands.map(cmd => cmd.execute())]);
      } catch (e) {
        await Promise.allSettled(this._startCommands.map(cmd => cmd.stop()));
        throw e;
      }
    }

    do {
      try {
        await this._spawnTestRunner();
        launchError = null;
      } catch (e) {
        launchError = e;

        if (this._terminating) {
          runsLeft = 0;
        }

        const failedTestFiles = detox.session.testResults.filter(r => !r.success);

        const { bail } = detox.config.testRunner;
        if (bail && failedTestFiles.some(r => r.isPermanentFailure)) {
          runsLeft = 0;
        }

        const testFilesToRetry = failedTestFiles.filter(r => !r.isPermanentFailure).map(r => r.testFilePath);
        if (testFilesToRetry.length === 0) {
          runsLeft = 0;
        }

        if (--runsLeft > 0) {
          // @ts-ignore
          detox.session.testSessionIndex++; // it is always the primary context, so we can update it

          this._argv._ = testFilesToRetry.map(useForwardSlashes);
          this._logRelaunchError(testFilesToRetry);
        }
      }
    } while (launchError && runsLeft > 0);

    await Promise.allSettled(this._startCommands.map(cmd => cmd.stop()));

    if (launchError) {
      throw launchError;
    }
  }

  _buildEnvHint(env) {
    return _(env)
      .mapKeys((_value, key) => key.toUpperCase())
      .pickBy((_value, key) => key.startsWith('DETOX_'))
      .omit(['DETOX_CONFIG_SNAPSHOT_PATH'])
      .value();
  }

  _prepareStartCommands(appsConfig, cliConfig) {
    if (`${cliConfig.start}` === 'false') {
      return [];
    }

    return _.values(appsConfig)
      .filter(app => app.start)
      .map(app => new AppStartCommand({
        cmd: app.start,
        forceSpawn: cliConfig.start === 'force',
      }));
  }

  /**
   * @param {DetoxInternals.CLIConfig} cliConfig
   * @param {Detox.DetoxDeviceConfig} deviceConfig
   */
  _buildEnvOverride(cliConfig, deviceConfig) {
    return _.omitBy({
      DETOX_APP_LAUNCH_ARGS: cliConfig.appLaunchArgs,
      DETOX_ARTIFACTS_LOCATION: cliConfig.artifactsLocation,
      DETOX_CAPTURE_VIEW_HIERARCHY: cliConfig.captureViewHierarchy,
      DETOX_CLEANUP: cliConfig.cleanup,
      DETOX_CONFIGURATION: cliConfig.configuration,
      DETOX_CONFIG_PATH: cliConfig.configPath,
      DETOX_DEBUG_SYNCHRONIZATION: cliConfig.debugSynchronization,
      DETOX_DEVICE_BOOT_ARGS: cliConfig.deviceBootArgs,
      DETOX_DEVICE_NAME: cliConfig.deviceName,
      DETOX_FORCE_ADB_INSTALL: deviceConfig.type.startsWith('android.')
        ? cliConfig.forceAdbInstall
        : undefined,
      DETOX_GPU: cliConfig.gpu,
      DETOX_HEADLESS: cliConfig.headless,
      DETOX_KEEP_LOCKFILE: cliConfig.keepLockFile,
      DETOX_LOGLEVEL: cliConfig.loglevel,
      DETOX_READ_ONLY_EMU: cliConfig.readonlyEmu,
      DETOX_RECORD_LOGS: cliConfig.recordLogs,
      DETOX_RECORD_PERFORMANCE: cliConfig.recordPerformance,
      DETOX_RECORD_VIDEOS: cliConfig.recordVideos,
      DETOX_REPORT_SPECS: cliConfig.jestReportSpecs,
      DETOX_RETRIES: cliConfig.retries,
      DETOX_REUSE: cliConfig.reuse,
      DETOX_TAKE_SCREENSHOTS: cliConfig.takeScreenshots,
      DETOX_USE_CUSTOM_LOGGER: cliConfig.useCustomLogger,
    }, _.isUndefined);
  }

  _onTerminate = () => {
    if (this._terminating) {
      return;
    }

    this._terminating = true;
    return detox.unsafe_conductEarlyTeardown(true);
  };

  async _spawnTestRunner() {
    const fullCommand = this._buildSpawnArguments().map(escapeSpaces);
    const fullCommandWithHint = printEnvironmentVariables(this._envHint) + fullCommand.join(' ');

    log.info.begin({ env: this._envHint }, fullCommandWithHint);

    return new Promise((resolve, reject) => {
      cp.spawn(fullCommand[0], fullCommand.slice(1), {
        shell: true,
        stdio: 'inherit',
        detached: this._detached,
        env: _({})
          .assign(process.env)
          .assign(this._envFwd)
          .omitBy(_.isUndefined)
          .tap(prependNodeModulesBinToPATH)
          .value()
      })
        .on('error', /* istanbul ignore next */ (err) => reject(err))
        .on('exit', (code, signal) => {
          interruptListeners.unsubscribe(this._onTerminate);

          if (code === 0) {
            log.trace.end({ success: true });
            resolve();
          } else {
            const error = new TestRunnerError({
              command: fullCommandWithHint,
              code,
              signal,
            });
            log.error.end({ success: false, code, signal }, error.message);
            reject(markErrorAsLogged(error));
          }
        });

      if (this._detached) {
        interruptListeners.subscribe(this._onTerminate);
      }
    });
  }

  _buildSpawnArguments() {
    /* istanbul ignore next */
    const { _: specs = [], '--': passthrough = [], $0, ...argv } = this._argv;
    const { _: $0_, ...$0argv } = parser($0);

    return [
      ...$0_,
      ...unparse($0argv),
      ...unparse(argv),
      ...unparse({ _: [...passthrough, ...specs] }),
    ].map(String);
  }

  _logRelaunchError(filePaths) {
    const list = filePaths.map((file, index) => {
      return `  ${index + 1}. ${toSimplePath(file)}`;
    }).join('\n');

    log.error(
      `There were failing tests in the following files:\n${list}\n\n` +
      'Detox CLI is going to restart the test runner with those files...\n'
    );
  }
}

module.exports = TestRunnerCommand;
