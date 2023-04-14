const DetoxError = require('../errors/DetoxError');
const { asError, createErrorWithUserStack, replaceErrorStack } = require('../utils/errorUtils');

function wrapWithStackTraceCutter(obj, methodNames) {
  for (const methodName of methodNames) {
    const originalMethod = obj[methodName];

    obj[methodName] = async function stackTraceWrapper() {
      const errorWithUserStack = createErrorWithUserStack();

      try {
        return await originalMethod.apply(obj, arguments);
      } catch (err) {
        if (err instanceof DetoxError) {
          throw replaceErrorStack(errorWithUserStack, asError(err));
        } else {
          throw err;
        }
      }
    };
  }
}

module.exports = wrapWithStackTraceCutter;
