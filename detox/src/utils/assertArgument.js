const _ = require('lodash');

const { DetoxInternalError, DetoxRuntimeError } = require('../errors');

function firstEntry(obj) {
  return _.entries(obj)[0] || ['value', obj];
}

function assertType(expectedType) {
  return function assertSpecificType(arg) {
    const [key, value] = firstEntry(arg);

    if (typeof value !== expectedType) {
      throw new DetoxRuntimeError(`${key} should be a ${expectedType}, but got ${value} (${typeof value})`);
    }
  };
}

const assertNumber = assertType('number');
const assertString = assertType('string');

function assertNormalized(arg) {
  assertNumber(arg);

  const [key, value] = firstEntry(arg);
  if (value < 0 || value > 1) {
    throw new DetoxRuntimeError(`${key} should be a number [0.0, 1.0], but got ${value} (${typeof value})`);
  }
}

function assertEnum(allowedValues) {
  return function assertSpecificEnum(arg) {
    const [key, value] = firstEntry(arg);

    if (allowedValues.indexOf(value) === -1) {
      throw new DetoxRuntimeError(`${key} should be one of [${allowedValues.join(', ')}], but got ${value} (${typeof value})`);
    }
  };
}

function assertDuration(duration) {
  if (typeof duration === 'number') {
    return true;
  }

  throw new DetoxRuntimeError('duration should be a number, but got ' + (duration + (' (' + (typeof duration + ')'))));
}

function assertPoint(point) {
  if (typeof point === 'object' && typeof point.x === 'number' &&  typeof point.y === 'number') {
    return true;
  }

  throw new DetoxRuntimeError(`point should be an object with x and y properties, but got ${JSON.stringify(point)}`);
}

function assertShouldIgnoreStatusBar(shouldIgnoreStatusBar) {
  if (typeof shouldIgnoreStatusBar === 'boolean') {
    return true;
  }

  throw new DetoxRuntimeError('shouldIgnoreStatusBar should be a boolean, but got ' + (shouldIgnoreStatusBar + (' (' + (typeof shouldIgnoreStatusBar + ')'))));
}

function assertUndefined(arg) {
  if (arg === undefined) {
    return true;
  }

  const [key, value] = firstEntry(arg);
  throw new DetoxRuntimeError(`${key} expected to be undefined, but got ${value} (${typeof value})`);
}

function assertTraceDescription(arg) {
  if (arg !== undefined) {
    return true;
  }

  throw new DetoxInternalError(`traceDescription expected to be defined, but got undefined`);
}

module.exports = {
  assertEnum,
  assertNormalized,
  assertNumber,
  assertString,
  assertDuration,
  assertPoint,
  assertShouldIgnoreStatusBar,
  assertUndefined,
  assertTraceDescription
};
