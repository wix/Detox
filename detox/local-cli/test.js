const path = require('path');
const cp = require('child_process');
const fs = require('fs-extra');
const _ = require('lodash');
const environment = require('../src/utils/environment');
const config = require(path.join(process.cwd(), 'package.json')).detox;
const buildDefaultArtifactsRootDirpath = require('../src/artifacts/utils/buildDefaultArtifactsRootDirpath');
const DetoxConfigError = require('../src/errors/DetoxConfigError');

module.exports.command = 'test';
module.exports.desc = 'Initiating your test suite';
module.exports.builder = {
  'test-runner': {
    alias: ['testRunner'],
    group: 'Configuration',
    describe: 'Test runner to use and pass configuration to',
    default: 'mocha',
    hidden: true,
  },
  'runner-config': {
    alias: ['o', 'runnerConfig'],
    group: 'Configuration',
    describe: 'Test runner config file, defaults to e2e/mocha.opts for mocha and e2e/config.json for jest'
  },
  file: {
    alias: 'f',
    group: 'Configuration',
    describe: '[DEPRECATED] Specify test file to run',
    hidden: true,
  },
  specs: {
    alias: 's',
    group: 'Configuration',
    describe: '[DEPRECATED] Root of test folder',
    hidden: true,
  },
  loglevel: {
    alias: 'l',
    group: 'Debugging',
    choices: ['fatal', 'error', 'warn', 'info', 'verbose', 'trace'],
    describe: 'Log level'
  },
  color: {
    describe: 'Enable colors in log output',
    default: true,
  },
  configurations: {
    group: 'Configuration',
    describe: 'Key-value map of Detox test configurations, usually defined in package.json',
    hidden: true,
  },
  configuration: {
    alias: 'c',
    group: 'Configuration',
    describe:
      'Select a device configuration from your defined configurations, if not supplied, and there\'s only one configuration, detox will default to it',
    default: getDefaultConfiguration()
  },
  reuse: {
    alias: 'r',
    group: 'Execution',
    describe: 'Reuse existing installed app (do not delete and re-install) for a faster run.'
  },
  cleanup: {
    alias: 'u',
    group: 'Execution',
    describe: 'Shutdown simulator when test is over, useful for CI scripts, to make sure detox exists cleanly with no residue'
  },
  'debug-synchronization': {
    alias: ['d', 'debugSynchronization'],
    group: 'Debugging',
    describe:
      'When an action/expectation takes a significant amount of time use this option to print device synchronization status.' +
      'The status will be printed if the action takes more than [value]ms to complete'
  },
  'artifacts-location': {
    alias: ['a', 'artifactsLocation'],
    group: 'Debugging',
    describe: 'Artifacts (logs, screenshots, etc) root directory.',
    default: 'artifacts'
  },
  'record-logs': {
    alias: 'recordLogs',
    group: 'Debugging',
    choices: ['failing', 'all', 'none'],
    default: 'none',
    describe: 'Save logs during each test to artifacts directory. Pass "failing" to save logs of failing tests only.'
  },
  'take-screenshots': {
    alias: 'takeScreenshots',
    group: 'Debugging',
    choices: ['failing', 'all', 'none'],
    default: 'none',
    describe:
      'Save screenshots before and after each test to artifacts directory. Pass "failing" to save screenshots of failing tests only.'
  },
  'record-videos': {
    alias: 'recordVideos',
    group: 'Debugging',
    choices: ['failing', 'all', 'none'],
    default: 'none',
    describe:
      'Save screen recordings of each test to artifacts directory. Pass "failing" to save recordings of failing tests only.'
  },
  headless: {
    alias: 'H',
    group: 'Execution',
    describe: '[Android Only] Launch Emulator in headless mode. Useful when running on CI.'
  },
  gpu: {
    group: 'Execution',
    describe: '[Android Only] Launch Emulator with the specific -gpu [gpu mode] parameter.'
  },
  workers: {
    alias: 'w',
    group: 'Execution',
    describe:
      '[iOS Only] Specifies number of workers the test runner should spawn, requires a test runner with parallel execution support (Detox CLI currently supports Jest)',
    default: 1,
    number: true
  },
  'device-name': {
    alias: ['n', 'deviceName'],
    group: 'Configuration',
    describe: 'Override the device name specified in a configuration. Useful for running a single build configuration on multiple devices.'
  }
};

module.exports.handler = function main(program) {
  program.artifactsLocation = buildDefaultArtifactsRootDirpath(program.configuration, program.artifactsLocation);

  clearDeviceRegistryLockFile();

  if (!program.configuration) {
    throw new DetoxConfigError(`Cannot determine which configuration to use.
    Use --configuration to choose one of the following: ${_.keys(config.configurations).join(', ')}`);
  }

  if (!config.configurations[program.configuration]) {
    throw new DetoxConfigError(`Cannot determine configuration '${program.configuration}'.
      Available configurations: ${_.keys(config.configurations).join(', ')}`);
  }

  const runnerConfig = program.runnerConfig || getDefaultRunnerConfig();
  const platform = config.configurations[program.configuration].type.split('.')[0];

  if (platform === 'android' && program.workers !== 1) {
    throw new DetoxConfigError('Can not use -w, --workers. Parallel test execution is only supported on iOS currently');
  }

  if (typeof program.debugSynchronization === 'boolean') {
    program.debugSynchronization = 3000;
  }

  function run() {
    switch (program.testRunner) {
      case 'mocha':
        runMocha();
        break;
      case 'jest':
        runJest();
        break;
      default:
        throw new Error(`${program.testRunner} is not supported in detox cli tools. You can still run your tests with the runner's own cli tool`);
    }
  }

  function aliasToArray(alias) {
    return (typeof alias === 'string' ? [alias] : (alias || []));
  }

  function collectExtraArgs() {
    const blacklistedArgs = Object.entries(module.exports.builder).reduce(
      (carry, [key, {alias}]) => carry.concat(key, aliasToArray(alias)),
      ['$0'],
    );

    const positionalArgs = program._.slice(1);

    return _.chain(program)
      .omit(blacklistedArgs)
      .pickBy((_value, key) => !key.includes('_') && !key.includes('-') && !key.includes('$'))
      .entries()
      .map(([key, value]) => `--${key}${value === true ? '' : ` ${value}`}`)
      .concat(positionalArgs)
      .value()
      .join(' ');
  }

  function runMocha() {
    const loglevel = program.loglevel ? `--loglevel ${program.loglevel}` : '';
    const configuration = program.configuration ? `--configuration ${program.configuration}` : '';
    const cleanup = program.cleanup ? `--cleanup` : '';
    const reuse = program.reuse ? `--reuse` : '';
    const artifactsLocation = program.artifactsLocation ? `--artifacts-location "${program.artifactsLocation}"` : '';
    const configFile = runnerConfig ? `--opts ${runnerConfig}` : '';
    const platformString = platform ? `--grep ${getPlatformSpecificString(platform)} --invert` : '';
    const logs = program.recordLogs ? `--record-logs ${program.recordLogs}` : '';
    const screenshots = program.takeScreenshots ? `--take-screenshots ${program.takeScreenshots}` : '';
    const videos = program.recordVideos ? `--record-videos ${program.recordVideos}` : '';
    const headless = program.headless ? `--headless` : '';
    const gpu = program.gpu ? `--gpu ${program.gpu}` : '';
    const color = program.color ? '' : '--no-colors';
    const deviceName = program.deviceName ? `--device-name "${program.deviceName}"` : '';

    const debugSynchronization = program.debugSynchronization ? `--debug-synchronization ${program.debugSynchronization}` : '';
    const binPath = path.join('node_modules', '.bin', 'mocha');
    const command =
      `${binPath} ${configFile} ${configuration} ${loglevel} ${color} ` +
      `${cleanup} ${reuse} ${debugSynchronization} ${platformString} ${headless} ${gpu}` +
      `${logs} ${screenshots} ${videos} ${artifactsLocation} ${deviceName} ${collectExtraArgs()}`;

    console.log(command);
    cp.execSync(command, { stdio: 'inherit' });
  }

  function runJest() {
    const configFile = runnerConfig ? `--config=${runnerConfig}` : '';

    const platformString = platform ? shellQuote(`--testNamePattern=^((?!${getPlatformSpecificString(platform)}).)*$`) : '';
    const binPath = path.join('node_modules', '.bin', 'jest');
    const color = program.color ? '' : ' --no-color';
    const command = `${binPath} ${configFile}${color} --maxWorkers=${program.workers} ${platformString} ${collectExtraArgs()}`;
    const detoxEnvironmentVariables = {
      configuration: program.configuration,
      loglevel: program.loglevel,
      cleanup: program.cleanup,
      reuse: program.reuse,
      debugSynchronization: program.debugSynchronization,
      gpu: program.gpu,
      headless: program.headless,
      artifactsLocation: program.artifactsLocation,
      recordLogs: program.recordLogs,
      takeScreenshots: program.takeScreenshots,
      recordVideos: program.recordVideos,
      deviceName: program.deviceName
    };

    console.log(printEnvironmentVariables(detoxEnvironmentVariables) + command);
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
      if (value === null || value === undefined || value === '') {
        return cli;
      }

      return `${cli}${key}=${JSON.stringify(value)} `;
    }, '');
  }

  function getDefaultRunnerConfig() {
    let defaultConfig;
    switch (program.testRunner) {
      case 'mocha':
        defaultConfig = 'e2e/mocha.opts';
        break;
      case 'jest':
        defaultConfig = 'e2e/config.json';
        break;
      default:
        console.log(`Missing 'runner-config' value in detox config in package.json, using '${defaultConfig}' as default for ${program.testRunner}`);
    }

    return defaultConfig;
  }

  function getPlatformSpecificString(platform) {
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

  // This is very incomplete, don't use this for user input!
  function shellQuote(input) {
    return process.platform !== 'win32' ? `'${input}'` : `"${input}"`;
  }

  run();
};

function getDefaultConfiguration() {
  if (config && _.size(config.configurations) === 1) {
    return _.keys(config.configurations)[0];
  }
}
