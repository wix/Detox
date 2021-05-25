const { DetoxRuntimeError } = require('../../../src/errors/DetoxRuntimeError');
const { filterErrorStack } = require('../../../src/utils/errorUtils');

function findUserConstructor() {
  let wasInBaseClass = false;
  let wasInUserClass = false;

  return function (line) {
    if (!wasInBaseClass) {
      if (/^\s*at new DetoxCircusEnvironment/.test(line)) {
        wasInBaseClass = true;
      }

      return false;
    }

    if (!wasInUserClass && /^\s*at new/.test(line)) {
      wasInUserClass = true;
    }

    return wasInUserClass;
  };
}

function assertExistingContext(context) {
  if (!context) {
    const error = new DetoxRuntimeError(`Please add both arguments to super() call in your environment constructor, e.g.:

 class CustomDetoxEnvironment extends DetoxCircusEnvironment {
-  constructor(config) {
-    super(config);
+  constructor(config, context) {
+    super(config, context);

Cannot proceed further. Please fix your custom Detox environment class.`);

    const userError = filterErrorStack(error, findUserConstructor());

    throw userError;
  }

  return context;
}

module.exports = assertExistingContext;
