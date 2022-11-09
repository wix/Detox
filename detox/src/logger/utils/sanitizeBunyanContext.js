const _ = require('lodash');

const RESERVED_PROPERTIES = [
  'hostname',
  'level',
  'msg',
  'name',
  'pid',
  'tid',
  'ph',
  'time',
];

function hasProperty(p) {
  return _.has(this, p);
}

function hasReservedProperties(o) {
  return RESERVED_PROPERTIES.some(hasProperty, o); // eslint-disable-line unicorn/no-array-method-this-argument
}

function escapeCallback(value, key) {
  return RESERVED_PROPERTIES.includes(key) ? `${key}$` : key;
}

function sanitizeBunyanContext(context) {
  return context && hasReservedProperties(context) ? _.mapKeys(context, escapeCallback) : context;
}

module.exports = sanitizeBunyanContext;
