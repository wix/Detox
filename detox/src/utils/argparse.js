const _ = require('lodash');
const argv = require('minimist')(process.argv.slice(2));
const {escape} = require('./pipeCommands');
const toUpper = (s) => s.toUpperCase();

function getArgValue(key) {
  let value;

  if (argv && argv[key]) {
    value = argv[key];
  } else {
    const resolvedKey = resolveProcessEnvKey([
      toUpper(`DETOX_${_.snakeCase(key)}`),
      _.camelCase(key),
    ]);

    if (resolvedKey !== undefined) {
      value = process.env[resolvedKey];
    }

    if (value === 'undefined') {
      value = undefined;
    }
  }

  return value;
}

function resolveProcessEnvKey(searchedKeys) {
  let envKeys = _.keys(process.env);

  /* istanbul ignore next */
  if (process.platform === 'win32') {
    searchedKeys = searchedKeys.map(toUpper);
    envKeys = envKeys.map(toUpper);
  }

  const keySet = new Set(envKeys);
  return searchedKeys.find(key => keySet.has(key));
}

function getFlag(key) {
  if (argv && argv[key]) {
    return true;
  }
  return false;
}

const DEFAULT_JOIN_ARGUMENTS_OPTIONS = {
  prefix: '--',
  joiner: ' ',
};

function joinArgs(keyValues, options = DEFAULT_JOIN_ARGUMENTS_OPTIONS) {
  const {prefix, joiner} = options === DEFAULT_JOIN_ARGUMENTS_OPTIONS
    ? options
    : { ...DEFAULT_JOIN_ARGUMENTS_OPTIONS, ...options };

  const argArray = [];

  for (const [key, value] of Object.entries(keyValues)) {
    if (value == null) {
      continue;
    }

    let arg = (!key.startsWith('-') ? prefix : '') + key;

    if (value !== true) {
      arg += joiner;

      if (_.isString(value) && value.includes(' ')) {
        arg += `"${escape.inQuotedString(value)}"`;
      } else {
        arg += value;
      }
    }

    argArray.push(arg)
  }

  return argArray.join(' ');
}

module.exports = {
  getArgValue,
  getFlag,
  joinArgs,
};
