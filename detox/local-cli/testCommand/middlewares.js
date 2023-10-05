const _ = require('lodash');

const { log } = require('../../internals');
const { getJestBooleanArgs } = require('../utils/jestInternals');
const { simpleUnquote, extractKnownKeys, disengageBooleanArgs } = require('../utils/yargsUtils');

const testCommandArgs = require('./builder');
const { DETOX_ARGV_OVERRIDE_NOTICE } = require('./warnings');

function applyEnvironmentVariableAddendum(argv, yargs) {
  if (process.env.DETOX_ARGV_OVERRIDE) {
    log.warn(DETOX_ARGV_OVERRIDE_NOTICE);

    const { _: positional, '--': passthrough, ...named } = yargs.parse(process.env.DETOX_ARGV_OVERRIDE);

    if (!_.isEmpty(positional)) {
      /* istanbul ignore next */
      argv._ = argv._ || [];
      argv._.push(...positional.map(simpleUnquote));
    }

    if (!_.isEmpty(passthrough)) {
      argv['--'] = argv['--'] || [];
      argv['--'].push(...passthrough.map(simpleUnquote));
    }

    Object.assign(argv, named);
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
  splitArgv,
};

module.exports.default = [
  applyEnvironmentVariableAddendum,
  splitArgv,
];
