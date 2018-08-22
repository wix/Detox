/**

	This code is generated.
	For more information see generation/README.md.
*/


function sanitize_matcher(matcher) {
  const originalMatcher = typeof matcher._call === 'function' ? matcher._call() : matcher._call;
  return originalMatcher.type ? originalMatcher.value : originalMatcher;
} 
class DetoxMatcher {
  static matcherForText(text) {
    if (typeof text !== "string") throw new Error("text should be a string, but got " + (text + (" (" + (typeof text + ")"))));
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.DetoxMatcher"
      },
      method: "matcherForText",
      args: [text]
    };
  }

  static matcherForContentDescription(contentDescription) {
    if (typeof contentDescription !== "string") throw new Error("contentDescription should be a string, but got " + (contentDescription + (" (" + (typeof contentDescription + ")"))));
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.DetoxMatcher"
      },
      method: "matcherForContentDescription",
      args: [contentDescription]
    };
  }

  static matcherForTestId(testId) {
    if (typeof testId !== "string") throw new Error("testId should be a string, but got " + (testId + (" (" + (typeof testId + ")"))));
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.DetoxMatcher"
      },
      method: "matcherForTestId",
      args: [testId]
    };
  }

  static matcherForAnd(m1, m2) {
    if (typeof m1 !== 'object' || typeof m1.constructor !== 'function' || m1.constructor.name.indexOf('Matcher') === -1) {
      const isObject = typeof m1 === 'object';
      const additionalErrorInfo = isObject ? typeof m1.constructor === 'object' ? 'the constructor is no object' : 'it has a wrong class name: "' + m1.constructor.name + '"' : 'it is no object';
      throw new Error('m1 should be an instance of Matcher, got "' + m1 + '", it appears that ' + additionalErrorInfo);
    }

    if (typeof m2 !== 'object' || typeof m2.constructor !== 'function' || m2.constructor.name.indexOf('Matcher') === -1) {
      const isObject = typeof m2 === 'object';
      const additionalErrorInfo = isObject ? typeof m2.constructor === 'object' ? 'the constructor is no object' : 'it has a wrong class name: "' + m2.constructor.name + '"' : 'it is no object';
      throw new Error('m2 should be an instance of Matcher, got "' + m2 + '", it appears that ' + additionalErrorInfo);
    }

    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.DetoxMatcher"
      },
      method: "matcherForAnd",
      args: [{
        type: "Invocation",
        value: sanitize_matcher(m1)
      }, {
        type: "Invocation",
        value: sanitize_matcher(m2)
      }]
    };
  }

  static matcherForOr(m1, m2) {
    if (typeof m1 !== 'object' || typeof m1.constructor !== 'function' || m1.constructor.name.indexOf('Matcher') === -1) {
      const isObject = typeof m1 === 'object';
      const additionalErrorInfo = isObject ? typeof m1.constructor === 'object' ? 'the constructor is no object' : 'it has a wrong class name: "' + m1.constructor.name + '"' : 'it is no object';
      throw new Error('m1 should be an instance of Matcher, got "' + m1 + '", it appears that ' + additionalErrorInfo);
    }

    if (typeof m2 !== 'object' || typeof m2.constructor !== 'function' || m2.constructor.name.indexOf('Matcher') === -1) {
      const isObject = typeof m2 === 'object';
      const additionalErrorInfo = isObject ? typeof m2.constructor === 'object' ? 'the constructor is no object' : 'it has a wrong class name: "' + m2.constructor.name + '"' : 'it is no object';
      throw new Error('m2 should be an instance of Matcher, got "' + m2 + '", it appears that ' + additionalErrorInfo);
    }

    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.DetoxMatcher"
      },
      method: "matcherForOr",
      args: [{
        type: "Invocation",
        value: sanitize_matcher(m1)
      }, {
        type: "Invocation",
        value: sanitize_matcher(m2)
      }]
    };
  }

  static matcherForNot(m) {
    if (typeof m !== 'object' || typeof m.constructor !== 'function' || m.constructor.name.indexOf('Matcher') === -1) {
      const isObject = typeof m === 'object';
      const additionalErrorInfo = isObject ? typeof m.constructor === 'object' ? 'the constructor is no object' : 'it has a wrong class name: "' + m.constructor.name + '"' : 'it is no object';
      throw new Error('m should be an instance of Matcher, got "' + m + '", it appears that ' + additionalErrorInfo);
    }

    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.DetoxMatcher"
      },
      method: "matcherForNot",
      args: [{
        type: "Invocation",
        value: sanitize_matcher(m)
      }]
    };
  }

  static matcherWithAncestor(m, ancestorMatcher) {
    if (typeof m !== 'object' || typeof m.constructor !== 'function' || m.constructor.name.indexOf('Matcher') === -1) {
      const isObject = typeof m === 'object';
      const additionalErrorInfo = isObject ? typeof m.constructor === 'object' ? 'the constructor is no object' : 'it has a wrong class name: "' + m.constructor.name + '"' : 'it is no object';
      throw new Error('m should be an instance of Matcher, got "' + m + '", it appears that ' + additionalErrorInfo);
    }

    if (typeof ancestorMatcher !== 'object' || typeof ancestorMatcher.constructor !== 'function' || ancestorMatcher.constructor.name.indexOf('Matcher') === -1) {
      const isObject = typeof ancestorMatcher === 'object';
      const additionalErrorInfo = isObject ? typeof ancestorMatcher.constructor === 'object' ? 'the constructor is no object' : 'it has a wrong class name: "' + ancestorMatcher.constructor.name + '"' : 'it is no object';
      throw new Error('ancestorMatcher should be an instance of Matcher, got "' + ancestorMatcher + '", it appears that ' + additionalErrorInfo);
    }

    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.DetoxMatcher"
      },
      method: "matcherWithAncestor",
      args: [{
        type: "Invocation",
        value: sanitize_matcher(m)
      }, {
        type: "Invocation",
        value: sanitize_matcher(ancestorMatcher)
      }]
    };
  }

  static matcherWithDescendant(m, descendantMatcher) {
    if (typeof m !== 'object' || typeof m.constructor !== 'function' || m.constructor.name.indexOf('Matcher') === -1) {
      const isObject = typeof m === 'object';
      const additionalErrorInfo = isObject ? typeof m.constructor === 'object' ? 'the constructor is no object' : 'it has a wrong class name: "' + m.constructor.name + '"' : 'it is no object';
      throw new Error('m should be an instance of Matcher, got "' + m + '", it appears that ' + additionalErrorInfo);
    }

    if (typeof descendantMatcher !== 'object' || typeof descendantMatcher.constructor !== 'function' || descendantMatcher.constructor.name.indexOf('Matcher') === -1) {
      const isObject = typeof descendantMatcher === 'object';
      const additionalErrorInfo = isObject ? typeof descendantMatcher.constructor === 'object' ? 'the constructor is no object' : 'it has a wrong class name: "' + descendantMatcher.constructor.name + '"' : 'it is no object';
      throw new Error('descendantMatcher should be an instance of Matcher, got "' + descendantMatcher + '", it appears that ' + additionalErrorInfo);
    }

    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.DetoxMatcher"
      },
      method: "matcherWithDescendant",
      args: [{
        type: "Invocation",
        value: sanitize_matcher(m)
      }, {
        type: "Invocation",
        value: sanitize_matcher(descendantMatcher)
      }]
    };
  }

  static matcherForClass(className) {
    if (typeof className !== "string") throw new Error("className should be a string, but got " + (className + (" (" + (typeof className + ")"))));
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.DetoxMatcher"
      },
      method: "matcherForClass",
      args: [className]
    };
  }

  static matcherForSufficientlyVisible() {
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.DetoxMatcher"
      },
      method: "matcherForSufficientlyVisible",
      args: []
    };
  }

  static matcherForNotVisible() {
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.DetoxMatcher"
      },
      method: "matcherForNotVisible",
      args: []
    };
  }

  static matcherForNotNull() {
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.DetoxMatcher"
      },
      method: "matcherForNotNull",
      args: []
    };
  }

  static matcherForNull() {
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.DetoxMatcher"
      },
      method: "matcherForNull",
      args: []
    };
  }

  static matcherForAtIndex(index, innerMatcher) {
    if (typeof index !== "number") throw new Error("index should be a number, but got " + (index + (" (" + (typeof index + ")"))));

    if (typeof innerMatcher !== 'object' || typeof innerMatcher.constructor !== 'function' || innerMatcher.constructor.name.indexOf('Matcher') === -1) {
      const isObject = typeof innerMatcher === 'object';
      const additionalErrorInfo = isObject ? typeof innerMatcher.constructor === 'object' ? 'the constructor is no object' : 'it has a wrong class name: "' + innerMatcher.constructor.name + '"' : 'it is no object';
      throw new Error('innerMatcher should be an instance of Matcher, got "' + innerMatcher + '", it appears that ' + additionalErrorInfo);
    }

    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.DetoxMatcher"
      },
      method: "matcherForAtIndex",
      args: [{
        type: "Integer",
        value: index
      }, {
        type: "Invocation",
        value: sanitize_matcher(innerMatcher)
      }]
    };
  }

  static matcherForAnything() {
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.DetoxMatcher"
      },
      method: "matcherForAnything",
      args: []
    };
  }

}

module.exports = DetoxMatcher;