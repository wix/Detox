module.exports = {
  C: {
    alias: 'config-path',
    group: 'Configuration:',
    describe: 'Specify Detox config file path. If not supplied, detox searches for .detoxrc[.js] or "detox" section in package.json',
  },
  c: {
    alias: ['configuration'],
    group: 'Configuration:',
    describe:
      'Select a device configuration from your defined configurations, if not supplied, and there\'s only one configuration, detox will default to it',
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
    describe: 'Log level',
  },
  'no-color': {
    describe: 'Disable colors in log output',
    boolean: true,
  },
  R: {
    alias: 'retries',
    group: 'Execution:',
    describe: '[Jest Circus Only] Re-spawn the test runner for individual failing suite files until they pass, or <N> times at least.',
    number: true,
    default: 0,
  },
  r: {
    alias: 'reuse',
    group: 'Execution:',
    describe: 'Reuse existing installed app (do not delete + reinstall) for a faster run.',
    boolean: true,
  },
  u: {
    alias: 'cleanup',
    group: 'Execution:',
    describe: 'Shutdown simulator when test is over, useful for CI scripts, to make sure detox exists cleanly with no residue',
    boolean: true,
  },
  d: {
    alias: 'debug-synchronization',
    group: 'Debugging:',
    coerce(value) {
      if (value == null || value === false || value === 'false') {
        return undefined;
      }

      if (value === true || value === 'true') {
        return 3000;
      }

      return Number.isNaN(+value) ? value : +value;
    },
    describe:
      'When an action/expectation takes a significant amount of time use this option to print device synchronization status.' +
      'The status will be printed if the action takes more than [value]ms to complete',
  },
  a: {
    alias: 'artifacts-location',
    group: 'Debugging:',
    describe: 'Artifacts (logs, screenshots, etc) root directory.',
  },
  'record-logs': {
    group: 'Debugging:',
    choices: ['failing', 'all', 'none'],
    describe: 'Save logs during each test to artifacts directory. Pass "failing" to save logs of failing tests only.',
  },
  'take-screenshots': {
    group: 'Debugging:',
    choices: ['manual', 'failing', 'all', 'none'],
    describe: 'Save screenshots before and after each test to artifacts directory. Pass "failing" to save screenshots of failing tests only.',
  },
  'record-videos': {
    group: 'Debugging:',
    choices: ['failing', 'all', 'none'],
    describe: 'Save screen recordings of each test to artifacts directory. Pass "failing" to save recordings of failing tests only.',
  },
  'record-performance': {
    group: 'Debugging:',
    choices: ['all', 'none'],
    describe: '[iOS Only] Save Detox Instruments performance recordings of each test to artifacts directory.',
  },
  'record-timeline': {
    group: 'Debugging:',
    choices: ['all', 'none'],
    describe: '[Jest Only] Record tests and events timeline, for visual display on the chrome://tracing tool.',
  },
  w: {
    alias: 'workers',
    group: 'Execution:',
    describe:
      '[iOS Only] Specifies the number of workers the test runner should spawn, requires a test runner with parallel execution support (Detox CLI currently supports Jest)',
    number: true,
    default: 1,
  },
  'jest-report-specs': {
    group: 'Execution:',
    describe: '[Jest Only] Whether to output logs per each running spec, in real-time. By default, disabled with multiple workers.',
    boolean: true,
  },
  H: {
    alias: 'headless',
    group: 'Execution:',
    describe: '[Android Only] Launch emulator in headless mode. Useful when running on CI.',
    boolean: true,
  },
  gpu: {
    group: 'Execution:',
    describe: '[Android Only] Launch emulator with the specific -gpu [gpu mode] parameter.',
  },
  keepLockFile:{
    group: 'Configuration:',
    describe:'Keep the device lock file when running Detox tests',
    boolean: true,
  },
  n: {
    alias: 'device-name',
    group: 'Configuration:',
    describe: 'Override the device name specified in a configuration. Useful for running a single build configuration on multiple devices.',
  },
  'device-launch-args': {
    group: 'Execution:',
    describe: 'Custom arguments to pass (through) onto the device (emulator/simulator) binary when launched.',
  },
  'app-launch-args': {
    group: 'Execution:',
    describe: 'Custom arguments to pass (through) onto the app every time it is launched.',
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
  'inspect-brk': {
    group: 'Debugging:',
    describe: 'Allows debugging of the underlying test runner',
    boolean: true,
  }
};
