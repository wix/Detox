const _ = require('lodash');

const detox = require('../../src');
const { getJestBooleanArgs } = require('../utils/jestInternals');
const { simpleUnquote, extractKnownKeys, disengageBooleanArgs } = require('../utils/yargsUtils');

const testCommandArgs = require('./builder');
const { DETOX_ARGV_OVERRIDE_NOTICE, DEVICE_LAUNCH_ARGS_DEPRECATION } = require('./warnings');

function applyEnvironmentVariableAddendum(argv, yargs) {
  if (process.env.DETOX_ARGV_OVERRIDE) {
    detox.log.warn(DETOX_ARGV_OVERRIDE_NOTICE);

    const { _: positional, '--': passthrough, ...o } = yargs.parse(process.env.DETOX_ARGV_OVERRIDE);

    if (positional) {
      argv._ = argv._ || [];
      argv._.push(...positional.map(simpleUnquote));
    }

    if (passthrough) {
      argv['--'] = argv['--'] || [];
      argv['--'].push(...passthrough.map(simpleUnquote));
    }

    Object.assign(argv, o);
  }

  return argv;
}

function warnDeviceAppLaunchArgsDeprecation(argv) {
  if (argv['device-boot-args'] && process.argv.some(a => a.startsWith('--device-launch-args'))) {
    detox.log.warn(DEVICE_LAUNCH_ARGS_DEPRECATION);
  }

  return argv;
}

/**
 * @param {Record<string, *>} argv
 * @returns {{
 *   detoxArgs: Record<string, *>,
 *   runnerArgs: Record<string, *>
 * }}
 */
function splitArgv(argv) {
  const aliases = extractKnownKeys(testCommandArgs);
  const isDetoxArg = (_value, key) => key === '$0' || aliases.has(key);

  const detoxArgs = _.pickBy(argv, isDetoxArg);
  const runnerArgv = _.omitBy(argv, isDetoxArg);
  runnerArgv._ = runnerArgv._.slice(1); // omit 'test' string, as in 'detox test'
  if (typeof detoxArgs['debug-synchronization'] === 'string') {
    const erroneousPassthrough = detoxArgs['debug-synchronization'];
    detoxArgs['debug-synchronization'] = 3000;
    runnerArgv._.unshift(erroneousPassthrough);
  }

  const runnerArgs = disengageBooleanArgs(runnerArgv, getJestBooleanArgs());
  return { detoxArgs, runnerArgs };
}

// noinspection JSUnusedGlobalSymbols
module.exports = {
  applyEnvironmentVariableAddendum,
  warnDeviceAppLaunchArgsDeprecation,
  splitArgv,
};

module.exports.default = [
  applyEnvironmentVariableAddendum,
  warnDeviceAppLaunchArgsDeprecation,
  splitArgv,
];
