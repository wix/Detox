/**

	This code is generated.
	For more information see generation/README.md.
*/


function sanitize_matcher(matcher) {
  if (!matcher._call) {
    return matcher;
  }

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

  static matcherForToggleable(value) {
    if (typeof value !== "boolean") throw new Error("value should be a boolean, but got " + (value + (" (" + (typeof value + ")"))));
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.DetoxMatcher"
      },
      method: "matcherForToggleable",
      args: [{
        type: "boolean",
        value: value
      }]
    };
  }

  static matcherForAnd(m1, m2) {
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

  static matcherForSufficientlyVisible(pct) {
    if (typeof pct !== "number") throw new Error("pct should be a number, but got " + (pct + (" (" + (typeof pct + ")"))));
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.DetoxMatcher"
      },
      method: "matcherForSufficientlyVisible",
      args: [{
        type: "Integer",
        value: pct
      }]
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

  static matcherForFocus() {
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.DetoxMatcher"
      },
      method: "matcherForFocus",
      args: []
    };
  }

  static matcherForSliderPosition(position, tolerance) {
    if (typeof position !== "number") throw new Error("position should be a number, but got " + (position + (" (" + (typeof position + ")"))));
    if (typeof tolerance !== "number") throw new Error("tolerance should be a number, but got " + (tolerance + (" (" + (typeof tolerance + ")"))));
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.DetoxMatcher"
      },
      method: "matcherForSliderPosition",
      args: [{
        type: "Double",
        value: position
      }, {
        type: "Double",
        value: tolerance
      }]
    };
  }

}

module.exports = DetoxMatcher;