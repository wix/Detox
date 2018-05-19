/**

	This code is generated.
	For more information see generation/README.md.
*/


function sanitize_matcher(matcher) {
  const originalMatcher = typeof matcher._call === 'function' ? matcher._call() : matcher._call;
  return originalMatcher.type ? originalMatcher.value : originalMatcher;
} 
class DetoxAssertion {
  static assertMatcher(i, m) {
    if (typeof m !== 'object' || typeof m.constructor !== 'function' || m.constructor.name.indexOf('Matcher') === -1) {
      const isObject = typeof m === 'object';
      const additionalErrorInfo = isObject ? typeof m.constructor === 'object' ? 'the constructor is no object' : 'it has a wrong class name: "' + m.constructor.name + '"' : 'it is no object';
      throw new Error('m should be an instance of Matcher, got "' + m + '", it appears that ' + additionalErrorInfo);
    }

    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.DetoxAssertion"
      },
      method: "assertMatcher",
      args: [{
        type: "ViewInteraction",
        value: i
      }, {
        type: "Invocation",
        value: sanitize_matcher(m)
      }]
    };
  }

  static assertNotVisible(i) {
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.DetoxAssertion"
      },
      method: "assertNotVisible",
      args: [{
        type: "ViewInteraction",
        value: i
      }]
    };
  }

  static assertNotExists(i) {
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.DetoxAssertion"
      },
      method: "assertNotExists",
      args: [{
        type: "ViewInteraction",
        value: i
      }]
    };
  }

  static waitForAssertMatcher(i, m, timeoutSeconds) {
    if (typeof m !== 'object' || typeof m.constructor !== 'function' || m.constructor.name.indexOf('Matcher') === -1) {
      const isObject = typeof m === 'object';
      const additionalErrorInfo = isObject ? typeof m.constructor === 'object' ? 'the constructor is no object' : 'it has a wrong class name: "' + m.constructor.name + '"' : 'it is no object';
      throw new Error('m should be an instance of Matcher, got "' + m + '", it appears that ' + additionalErrorInfo);
    }

    if (typeof timeoutSeconds !== "number") throw new Error("timeoutSeconds should be a number, but got " + (timeoutSeconds + (" (" + (typeof timeoutSeconds + ")"))));
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.DetoxAssertion"
      },
      method: "waitForAssertMatcher",
      args: [{
        type: "ViewInteraction",
        value: i
      }, {
        type: "Invocation",
        value: sanitize_matcher(m)
      }, {
        type: "Double",
        value: timeoutSeconds
      }]
    };
  }

  static waitForAssertMatcherWithSearchAction(i, m, searchAction, searchMatcher) {
    if (typeof m !== 'object' || typeof m.constructor !== 'function' || m.constructor.name.indexOf('Matcher') === -1) {
      const isObject = typeof m === 'object';
      const additionalErrorInfo = isObject ? typeof m.constructor === 'object' ? 'the constructor is no object' : 'it has a wrong class name: "' + m.constructor.name + '"' : 'it is no object';
      throw new Error('m should be an instance of Matcher, got "' + m + '", it appears that ' + additionalErrorInfo);
    }

    if (typeof searchMatcher !== 'object' || typeof searchMatcher.constructor !== 'function' || searchMatcher.constructor.name.indexOf('Matcher') === -1) {
      const isObject = typeof searchMatcher === 'object';
      const additionalErrorInfo = isObject ? typeof searchMatcher.constructor === 'object' ? 'the constructor is no object' : 'it has a wrong class name: "' + searchMatcher.constructor.name + '"' : 'it is no object';
      throw new Error('searchMatcher should be an instance of Matcher, got "' + searchMatcher + '", it appears that ' + additionalErrorInfo);
    }

    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.DetoxAssertion"
      },
      method: "waitForAssertMatcherWithSearchAction",
      args: [{
        type: "ViewInteraction",
        value: i
      }, {
        type: "Invocation",
        value: sanitize_matcher(m)
      }, {
        type: "ViewAction",
        value: searchAction
      }, {
        type: "Invocation",
        value: sanitize_matcher(searchMatcher)
      }]
    };
  }

}

module.exports = DetoxAssertion;