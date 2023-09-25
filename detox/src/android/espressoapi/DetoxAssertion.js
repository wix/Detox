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
class DetoxAssertion {
  static assertMatcher(viewInteraction, viewMatcher) {
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.DetoxAssertion"
      },
      method: "assertMatcher",
      args: [{
        type: "Invocation",
        value: viewInteraction
      }, {
        type: "Invocation",
        value: sanitize_matcher(viewMatcher)
      }]
    };
  }

  static assertNotVisible(viewInteraction) {
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.DetoxAssertion"
      },
      method: "assertNotVisible",
      args: [{
        type: "Invocation",
        value: viewInteraction
      }]
    };
  }

  static assertNotExists(viewInteraction) {
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.DetoxAssertion"
      },
      method: "assertNotExists",
      args: [{
        type: "Invocation",
        value: viewInteraction
      }]
    };
  }

  static waitForAssertMatcher(viewInteraction, viewMatcher, timeoutSeconds) {
    if (typeof timeoutSeconds !== "number") throw new Error("timeoutSeconds should be a number, but got " + (timeoutSeconds + (" (" + (typeof timeoutSeconds + ")"))));
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.DetoxAssertion"
      },
      method: "waitForAssertMatcher",
      args: [{
        type: "Invocation",
        value: viewInteraction
      }, {
        type: "Invocation",
        value: sanitize_matcher(viewMatcher)
      }, {
        type: "Double",
        value: timeoutSeconds
      }]
    };
  }

  static waitForAssertMatcherWithSearchAction(viewInteraction, viewMatcher, searchAction, searchMatcher
  ) {
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.DetoxAssertion"
      },
      method: "waitForAssertMatcherWithSearchAction",
      args: [{
        type: "Invocation",
        value: viewInteraction
      }, {
        type: "Invocation",
        value: sanitize_matcher(viewMatcher)
      }, searchAction, {
        type: "Invocation",
        value: sanitize_matcher(searchMatcher
        )
      }]
    };
  }

}

module.exports = DetoxAssertion;