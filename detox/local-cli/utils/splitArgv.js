const _ = require('lodash');
const path = require('path');
const resolveFrom = require('resolve-from');
const testCommandArgs = require('./testCommandArgs');

function extractKnownKeys(yargsBuilder) {
  return Object.entries(yargsBuilder).reduce(
    (set, [key, option]) => {
      if (option.alias) {
        if (Array.isArray(option.alias)) {
          for (const value of option.alias) {
            set.add(value);
          }
        } else {
          set.add(option.alias);
        }
      }

      return set.add(key);
    },
    new Set()
  );
}

function disengageBooleanArgs(argv, booleanKeys) {
  const result = {};
  const passthrough = [];

  for (const entry of Object.entries(argv)) {
    const [key, value] = entry;
    if (key === '_') {
      continue;
    }

    const positiveKey = key.startsWith('no-') ? key.slice(3) : key;
    if (booleanKeys.has(positiveKey) && typeof value !== 'boolean') {
      result[positiveKey] = key === positiveKey;
      passthrough.push(value);
    } else {
      result[key] = value;
    }
  }

  return {
    specs: passthrough.concat(argv._),
    passthrough: {
      _: [],
      ...result,
    },
  };
}

function getJestBooleanArgs() {
  const jestLocation = path.dirname(resolveFrom(process.cwd(), 'jest/package.json'));
  const jestCliArgsPath = resolveFrom(jestLocation, 'jest-cli/build/cli/args');

  return _(require(jestCliArgsPath))
    .thru(args => args.options)
    .pickBy(({ type }) => type === 'boolean')
    .thru(extractKnownKeys)
    .value();
}

function getMochaBooleanArgs() {
  const metadata = require('mocha/lib/cli/run-option-metadata');

  return _(metadata.types.boolean)
    .flatMap(key => [key, ...(metadata.aliases[key] || [])])
    .thru(keys => new Set(keys))
    .value();
}

function splitDetoxArgv(argv) {
  const aliases = extractKnownKeys(testCommandArgs);
  const isDetoxArg = (_value, key) => aliases.has(key);

  const detoxArgs = _.pickBy(argv, isDetoxArg);
  const runnerArgs = _.omitBy(argv, isDetoxArg);
  runnerArgs._ = runnerArgs._.slice(1); // omit 'test' string, as in 'detox test'
  if (typeof detoxArgs['debug-synchronization'] === 'string') {
    const erroneousPassthrough = detoxArgs['debug-synchronization'];
    detoxArgs['debug-synchronization'] = 3000;
    runnerArgs._.unshift(erroneousPassthrough);
  }

  return { detoxArgs, runnerArgs };
}

function splitMochaArgv(argv) {
  return disengageBooleanArgs(argv, getMochaBooleanArgs());
}

function splitJestArgv(argv) {
  return disengageBooleanArgs(argv, getJestBooleanArgs());
}

module.exports = {
  detox: splitDetoxArgv,
  jest: splitJestArgv,
  mocha: splitMochaArgv,
};
