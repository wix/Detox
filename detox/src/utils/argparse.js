const _ = require('lodash');
const { escape } = require('./pipeCommands');
const argv = require('minimist')(process.argv.slice(2));

function getArgValue(key) {
  let value;

  if (argv && argv[key]) {
    value = argv[key];
  } else {
    const camelCasedKey = key.replace(/(\-\w)/g, (m) => m[1].toUpperCase());
    value = process.env[camelCasedKey];
    if (value === 'undefined') {
      value = undefined;
    }
  }

  return value;
}

function getFlag(key) {
  if (argv && argv[key]) {
    return true;
  }
  return false;
}

function createTransformFunction({ prefix = '--', kebab = false }) {
  const addPrefix = typeof prefix === 'string' ? s => prefix + s : _.identity;
  const convertKebab = kebab ? _.kebabCase : _.identity;

  return _.flow((value, key) => key, convertKebab, addPrefix);
}

function escapeSpaces(str) {
  return str.indexOf(' ') >= 0 ?
    `"${escape.inQuotedString(str)}"`
    : str;
}

function composeArgs(args, formatting = {}) {
  const transformKey = createTransformFunction({
    prefix: formatting.prefix,
    kebab: formatting.kebab,
  });

  return _.chain(args)
    .omitBy(v => v === false || v == null)
    .mapValues(v => v === true ? '' : escapeSpaces(String(v)))
    .mapKeys(transformKey)
    .entries()
    .flatten()
    .compact()
    .value()
    .join(' ');
}

module.exports = {
  getArgValue,
  getFlag,
  composeArgs,
};
