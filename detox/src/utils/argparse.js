const path = require('path');

const _ = require('lodash');

const { escape } = require('./pipeCommands');

function getEnvValue(key) {
  const envKey = _.findKey(process.env, matchesKey(
    `DETOX_${_.snakeCase(key)}`.toUpperCase()
  ));

  let value = process.env[envKey];
  if (value === 'undefined') {
    value = undefined;
  }

  return value;
}

function matchesKey(key) {
  return /* istanbul ignore next */ process.platform === 'win32'
    ? (value, envKey) => envKey.toUpperCase() === key
    : (value, envKey) => envKey === key;
}

const DEFAULT_JOIN_ARGUMENTS_OPTIONS = {
  prefix: '--',
  joiner: ' ',
};

function joinArgs(keyValues, options = DEFAULT_JOIN_ARGUMENTS_OPTIONS) {
  const { prefix, joiner } = options === DEFAULT_JOIN_ARGUMENTS_OPTIONS
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

    argArray.push(arg);
  }

  return argArray.join(' ');
}

function getCurrentCommand() {
  const cwd = process.cwd();

  return process.argv.slice(1).map((value, index) => {
    return index ? value : path.relative(cwd, value);
  }).join(' ');
}

module.exports = {
  getEnvValue,
  joinArgs,
  getCurrentCommand,
};
