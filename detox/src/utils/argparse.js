const path = require('path');

const _ = require('lodash');

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

function joinArgs(keyValues, prefix = '--') {
  const argArray = [];

  for (const [key, value] of Object.entries(keyValues)) {
    if (value == null) {
      continue;
    }

    const arg = (key.startsWith('-') ? '' : prefix) + key;
    argArray.push(arg);
    if (value !== true) {
      argArray.push(String(value));
    }
  }

  return argArray;
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
