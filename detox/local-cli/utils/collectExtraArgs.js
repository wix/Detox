const _ = require('lodash');
const parseArgv = require('yargs-parser');

function collectBlacklistedArgs(builder) {
  return Object.entries(builder).reduce(
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
    new Set(['$0', '_', '--'])
  );
}

function configureCollectExtraArgs(builder) {
  const blacklistedArgs = collectBlacklistedArgs(builder);

  return function collectExtraArgs(argv) {
    const parsed = parseArgv(argv, {
      configuration: {
        'boolean-negation': false,
        'camel-case-expansion': false,
        'dot-notation': false,
        'parse-numbers': false,
        'duplicate-arguments-array': false
      }
    });

    const passthrough = _.chain(parsed)
      .omitBy((_value, key) => blacklistedArgs.has(key))
      .entries()
      .map(([key, value]) => {
        return value === true ? `--${key}` : `--${key} ${value}`;
      })
      .concat(parsed['_'])
      .value()
      .join(' ');

    return passthrough;
  };
}

module.exports = configureCollectExtraArgs;
