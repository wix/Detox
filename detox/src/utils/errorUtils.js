const { isError } = require('lodash');
const { deserializeError, serializeError } = require('serialize-error');

const CLEAN_AT = /\n\s*at [\s\S]*/m;

function filterErrorStack(error, predicate) {
  const stackLines = (error.stack || '').split('\n');
  const resultLines = [];
  for (const line of stackLines) {
    if (line.trimLeft().startsWith('at') && !predicate(line)) {
      continue;
    }

    resultLines.push(line);
  }
  error.stack = resultLines.join('\n');
  return error;
}

function replaceErrorStack(source, target) {
  const sourceStack = (source.stack || '');
  const sourceMessage = sourceStack.replace(CLEAN_AT, '');
  const actualSourceStack = sourceStack.slice(sourceMessage.length);

  const targetMessage = target.message || target.stack.replace(CLEAN_AT, '');

  target.stack = targetMessage + actualSourceStack;
  return target;
}

function isInternalStackLine(line) {
  return line.indexOf('/detox/src/') === -1;
}

function createErrorWithUserStack() {
  return filterErrorStack(new Error(), isInternalStackLine);
}

function asError(error) {
  return isError(error) ? error : new Error(error);
}

function serializeObjectWithError(obj, errorKey = 'error') {
  if (obj[errorKey] instanceof Error) {
    return { ...obj, [errorKey]: serializeError(obj[errorKey]) };
  }

  return obj;
}

function deserializeObjectWithError(obj, errorKey = 'error') {
  if (typeof obj[errorKey] === 'object' && !(obj[errorKey] instanceof Error)) {
    return { ...obj, [errorKey]: deserializeError(obj[errorKey]) };
  }

  return obj;
}

module.exports = {
  asError,
  replaceErrorStack,
  filterErrorStack,
  createErrorWithUserStack,
  serializeObjectWithError,
  deserializeObjectWithError,
};
