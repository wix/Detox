const _ = require('lodash');
const argv = require('minimist')(process.argv.slice(2));
const {escape} = require('./pipeCommands');

function getArgValue(key) {
  let value;

  if (argv && argv[key]) {
    value = argv[key];
  } else {
    value = getEnvVar([
      `DETOX_${_.snakeCase(key)}`.toUpperCase(),
      _.camelCase(key),
    ]);

    if (value === 'undefined') {
      value = undefined;
    }
  }

  return value;
}

function getEnvVar(aliases) {
  const env = getNormalizedEnv();

  for (const key of getNormalizedAliases(aliases)) {
    if (env[key] !== undefined) {
      return env[key];
    }
  }
}

const getNormalizedEnv = _.once(() => {
  return /* istanbul ignore next */ process.platform === 'win32'
    ? _.mapKeys(process.env, (value, key) => key.toUpperCase())
    : { ...process.env };
});

const getNormalizedAliases = (aliases) => {
  return /* istanbul ignore next */ process.platform === 'win32'
    ? aliases.map(key => key.toUpperCase())
    : aliases;
};

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
