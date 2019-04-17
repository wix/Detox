const _ = require('lodash');
const path = require('path');
const cp = require('child_process');
const fs = require('fs-extra');
const environment = require('../src/utils/environment');
const buildDefaultArtifactsRootDirpath = require('../src/artifacts/utils/buildDefaultArtifactsRootDirpath');
const DetoxConfigError = require('../src/errors/DetoxConfigError');

const log = require('../src/utils/logger').child({ __filename });
const {getDetoxSection, getDefaultConfiguration, getConfigurationByKey} = require('./utils/configurationUtils');
const {coerceDeprecation, migrationGuideUrl} = require('./utils/deprecation');
const shellQuote = require('./utils/shellQuote');

module.exports.command = 'test';
module.exports.desc = 'Run your test suite with the test runner specified in package.json';
module.exports.builder = {
  c: {
    alias: ['configuration'],
    group: 'Configuration:',
    default: getDefaultConfiguration(),
    describe:
      'Select a device configuration from your defined configurations, if not supplied, and there\'s only one configuration, detox will default to it'
  },
  o: {
    alias: 'runner-config',
    group: 'Configuration:',
    describe: 'Test runner config file, defaults to e2e/mocha.opts for mocha and e2e/config.json for jest',
  },
  f: {
    alias: 'file',
    group: 'Configuration:',
    describe: 'Specify test file to run',
    coerce: coerceDeprecation('-f, --file'),
    hidden: true,
  },
  s: {
    alias: 'specs',
    group: 'Configuration:',
    describe: 'Root of tests look-up folder. Overrides the equivalent configuration in `package.json`, if set.',
    coerce: coerceDeprecation('-s, --specs'),
    hidden: true,
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
    describe: 'Artifacts (logs, screenshots, etc) root directory.',
    default: 'artifacts'
  },
  'record-logs': {
    group: 'Debugging:',
    choices: ['failing', 'all', 'none'],
    default: 'none',
    describe: 'Save logs during each test to artifacts directory. Pass "failing" to save logs of failing tests only.'
  },
  'take-screenshots': {
    group: 'Debugging:',
    choices: ['manual', 'failing', 'all', 'none'],
    default: 'manual',
    describe:
      'Save screenshots before and after each test to artifacts directory. Pass "failing" to save screenshots of failing tests only.'
  },
  'record-videos': {
    group: 'Debugging:',
    choices: ['failing', 'all', 'none'],
    default: 'none',
    describe:
      'Save screen recordings of each test to artifacts directory. Pass "failing" to save recordings of failing tests only.'
  },
  w: {
    alias: 'workers',
    group: 'Execution:',
    describe:
      '[iOS Only] Specifies number of workers the test runner should spawn, requires a test runner with parallel execution support (Detox CLI currently supports Jest)',
    default: 1,
    number: true
  },
  H: {
    alias: 'headless',
    group: 'Execution:',
    describe: '[Android Only] Launch Emulator in headless mode. Useful when running on CI.'
  },
  gpu: {
    group: 'Execution:',
    describe: '[Android Only] Launch Emulator with the specific -gpu [gpu mode] parameter.'
  },
  n: {
    alias: 'device-name',
    group: 'Configuration:',
    describe: 'Override the device name specified in a configuration. Useful for running a single build configuration on multiple devices.'
  }
};

const collectExtraArgs = require('./utils/collectExtraArgs')(module.exports.builder);

module.exports.handler = async function test(program) {
  program.artifactsLocation = buildDefaultArtifactsRootDirpath(program.configuration, program.artifactsLocation);

  clearDeviceRegistryLockFile();

  const config = getDetoxSection();

  let testFolder = getConfigFor(['file', 'specs'], 'e2e');
  testFolder = testFolder && `"${testFolder}"`;

  if (testFolder && !program.file && !program.specs) {
    log.warn('Deprecation warning: "file" and "specs" support will be dropped in the next Detox version.');
    log.warn(`Please edit your package.json according to the migration guide: ${migrationGuideUrl} `);
  }

  const runner = getConfigFor(['test-runner'], 'mocha');
  const runnerConfig = getConfigFor(['runner-config'], getDefaultRunnerConfig());

  const currentConfiguration = getConfigurationByKey(program.configuration);
  if (!currentConfiguration.type) {
    throw new DetoxConfigError(`Missing "type" inside detox.configurations["${program.configuration}"]`);
  }

  const platform = currentConfiguration.type.split('.')[0];

  function run() {
    switch (runner) {
      case 'mocha':
        runMocha();
        break;
      case 'jest':
        runJest();
        break;
      default:
        throw new Error(`${runner} is not supported in detox cli tools. You can still run your tests with the runner's own cli tool`);
    }
  }

  function getConfigFor(keys, fallback) {
    for (const key of keys) {
      const camel = _.camelCase(key);
      const result = program[key] || config[camel] || config[key];

      if (result != null) {
        return result;
      }
    }

    return fallback;
  }

  function hasCustomValue(key) {
    const value = program[key];
    const metadata = module.exports.builder[key];

    return (value !== metadata.default);
  }

  function runMocha() {
    if (program.workers !== 1) {
      log.warn('Can not use -w, --workers. Parallel test execution is only supported with iOS and Jest');
    }

    const command = _.compact([
      (path.join('node_modules', '.bin', 'mocha')),
      (runnerConfig ? `--opts ${runnerConfig}` : ''),
      (program.configuration ? `--configuration ${program.configuration}` : ''),
      (program.loglevel ? `--loglevel ${program.loglevel}` : ''),
      (program.noColor ? '--no-colors' : ''),
      (program.cleanup ? `--cleanup` : ''),
      (program.reuse ? `--reuse` : ''),
      (isFinite(program.debugSynchronization) ? `--debug-synchronization ${program.debugSynchronization}` : ''),
      (platform ? `--grep ${getPlatformSpecificString()} --invert` : ''),
      (program.headless ? `--headless` : ''),
      (program.gpu ? `--gpu ${program.gpu}` : ''),
      (hasCustomValue('record-logs') ? `--record-logs ${program.recordLogs}` : ''),
      (hasCustomValue('take-screenshots') ? `--take-screenshots ${program.takeScreenshots}` : ''),
      (hasCustomValue('record-videos') ? `--record-videos ${program.recordVideos}` : ''),
      (program.artifactsLocation ? `--artifacts-location "${program.artifactsLocation}"` : ''),
      (program.deviceName ? `--device-name "${program.deviceName}"` : ''),
      testFolder,
      collectExtraArgs(process.argv.slice(3)),
    ]).join(' ');

    log.info(command);
    cp.execSync(command, { stdio: 'inherit' });
  }

  function runJest() {
    if (platform === 'android' && program.workers !== 1) {
      log.warn('Can not use -w, --workers. Parallel test execution is only supported on iOS currently');
      program.w = program.workers = 1;
    }

    const command = _.compact([
      path.join('node_modules', '.bin', 'jest'),
      (runnerConfig ? `--config=${runnerConfig}` : ''),
      (program.noColor ? ' --no-color' : ''),
      `--maxWorkers=${program.workers}`,
      (platform ? shellQuote(`--testNamePattern=^((?!${getPlatformSpecificString()}).)*$`) : ''),
      testFolder,
      collectExtraArgs(process.argv.slice(3)),
    ]).join(' ');

    const detoxEnvironmentVariables = _.pick(program, [
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
      'deviceName',
    ]);

    log.info(printEnvironmentVariables(detoxEnvironmentVariables) + command);
    cp.execSync(command, {
      stdio: 'inherit',
      env: {
        ...process.env,
        ...detoxEnvironmentVariables
      }
    });
  }

  function printEnvironmentVariables(envObject) {
    return Object.entries(envObject).reduce((cli, [key, value]) => {
      if (value == null || value === '') {
        return cli;
      }

      return `${cli}${key}=${JSON.stringify(value)} `;
    }, '');
  }

  function getDefaultRunnerConfig() {
    switch (runner) {
      case 'mocha':
        return 'e2e/mocha.opts';
      case 'jest':
        return 'e2e/config.json';
      default:
        return undefined;
    }
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
    const lockFilePath = environment.getDeviceLockFilePath();
    fs.ensureFileSync(lockFilePath);
    fs.writeFileSync(lockFilePath, '[]');
  }


  run();
};
