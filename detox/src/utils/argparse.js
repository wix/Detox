const _ = require('lodash');
const argv = require('minimist')(process.argv.slice(2));
const {escape} = require('./pipeCommands');

function getArgValue(key) {
  let value;

  if (argv && argv[key]) {
    value = argv[key];
  } else {
    const envKey = _.findKey(process.env, matchesKey(
      `DETOX_${_.snakeCase(key)}`.toUpperCase()
    ));

    value = process.env[envKey];
    if (value === 'undefined') {
      value = undefined;
    }
  }

  return value;
}

function matchesKey(key) {
  return /* istanbul ignore next */ process.platform === 'win32'
    ? (value, envKey) => envKey.toUpperCase() === key
    : (value, envKey) => envKey === key;
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
