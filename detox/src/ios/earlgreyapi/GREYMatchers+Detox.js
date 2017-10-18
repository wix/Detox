/**

	This code is generated.
	For more information see generation/README.md.
*/


// Globally declared helpers

function sanitize_greyDirection(action) {
  switch (action) {
    case "left":
      return 1;
    case "right":
      return 2;
    case "up":
      return 3;
    case "down":
      return 4;
      
    default:
      throw new Error(`GREYAction.GREYDirection must be a 'left'/'right'/'up'/'down', got ${action}`);
  }
}

function sanitize_greyContentEdge(action) {
  switch (action) {
    case "left":
      return 0;
    case "right":
      return 1;
    case "top":
      return 2;
    case "bottom":
      return 3;

    default:
      throw new Error(`GREYAction.GREYContentEdge must be a 'left'/'right'/'top'/'bottom', got ${action}`);
  }
}



class GREYMatchers {
  static detoxMatcherForText(text) {
    if (typeof text !== "string") throw new Error("text should be a string, but got " + (text + (" (" + (typeof text + ")"))));
    return {
      target: {
        type: "Class",
        value: "GREYMatchers"
      },
      method: "detoxMatcherForText:",
      args: [{
        type: "NSString",
        value: text
      }]
    };
  }

  static detoxMatcherForScrollChildOfMatcher(matcher) {
    if (typeof matcher !== "object" || matcher.type !== "Invocation" || typeof matcher.value !== "object" || typeof matcher.value.target !== "object" || matcher.value.target.value !== "GREYMatchers") {
      throw new Error('matcher should be a GREYMatcher, but got ' + JSON.stringify(matcher));
    }

    return {
      target: {
        type: "Class",
        value: "GREYMatchers"
      },
      method: "detoxMatcherForScrollChildOfMatcher:",
      args: [matcher]
    };
  }

  static detoxMatcherAvoidingProblematicReactNativeElements(matcher) {
    if (typeof matcher !== "object" || matcher.type !== "Invocation" || typeof matcher.value !== "object" || typeof matcher.value.target !== "object" || matcher.value.target.value !== "GREYMatchers") {
      throw new Error('matcher should be a GREYMatcher, but got ' + JSON.stringify(matcher));
    }

    return {
      target: {
        type: "Class",
        value: "GREYMatchers"
      },
      method: "detoxMatcherAvoidingProblematicReactNativeElements:",
      args: [matcher]
    };
  }

  static detoxMatcherForBothAnd(firstMatcher, secondMatcher) {
    if (typeof firstMatcher !== "object" || firstMatcher.type !== "Invocation" || typeof firstMatcher.value !== "object" || typeof firstMatcher.value.target !== "object" || firstMatcher.value.target.value !== "GREYMatchers") {
      throw new Error('firstMatcher should be a GREYMatcher, but got ' + JSON.stringify(firstMatcher));
    }

    if (typeof secondMatcher !== "object" || secondMatcher.type !== "Invocation" || typeof secondMatcher.value !== "object" || typeof secondMatcher.value.target !== "object" || secondMatcher.value.target.value !== "GREYMatchers") {
      throw new Error('secondMatcher should be a GREYMatcher, but got ' + JSON.stringify(secondMatcher));
    }

    return {
      target: {
        type: "Class",
        value: "GREYMatchers"
      },
      method: "detoxMatcherForBoth:and:",
      args: [firstMatcher, secondMatcher]
    };
  }

  static detoxMatcherForBothAndAncestorMatcher(firstMatcher, ancestorMatcher) {
    if (typeof firstMatcher !== "object" || firstMatcher.type !== "Invocation" || typeof firstMatcher.value !== "object" || typeof firstMatcher.value.target !== "object" || firstMatcher.value.target.value !== "GREYMatchers") {
      throw new Error('firstMatcher should be a GREYMatcher, but got ' + JSON.stringify(firstMatcher));
    }

    if (typeof ancestorMatcher !== "object" || ancestorMatcher.type !== "Invocation" || typeof ancestorMatcher.value !== "object" || typeof ancestorMatcher.value.target !== "object" || ancestorMatcher.value.target.value !== "GREYMatchers") {
      throw new Error('ancestorMatcher should be a GREYMatcher, but got ' + JSON.stringify(ancestorMatcher));
    }

    return {
      target: {
        type: "Class",
        value: "GREYMatchers"
      },
      method: "detoxMatcherForBoth:andAncestorMatcher:",
      args: [firstMatcher, ancestorMatcher]
    };
  }

  static detoxMatcherForBothAndDescendantMatcher(firstMatcher, descendantMatcher) {
    if (typeof firstMatcher !== "object" || firstMatcher.type !== "Invocation" || typeof firstMatcher.value !== "object" || typeof firstMatcher.value.target !== "object" || firstMatcher.value.target.value !== "GREYMatchers") {
      throw new Error('firstMatcher should be a GREYMatcher, but got ' + JSON.stringify(firstMatcher));
    }

    if (typeof descendantMatcher !== "object" || descendantMatcher.type !== "Invocation" || typeof descendantMatcher.value !== "object" || typeof descendantMatcher.value.target !== "object" || descendantMatcher.value.target.value !== "GREYMatchers") {
      throw new Error('descendantMatcher should be a GREYMatcher, but got ' + JSON.stringify(descendantMatcher));
    }

    return {
      target: {
        type: "Class",
        value: "GREYMatchers"
      },
      method: "detoxMatcherForBoth:andDescendantMatcher:",
      args: [firstMatcher, descendantMatcher]
    };
  }

  static detoxMatcherForNot(matcher) {
    if (typeof matcher !== "object" || matcher.type !== "Invocation" || typeof matcher.value !== "object" || typeof matcher.value.target !== "object" || matcher.value.target.value !== "GREYMatchers") {
      throw new Error('matcher should be a GREYMatcher, but got ' + JSON.stringify(matcher));
    }

    return {
      target: {
        type: "Class",
        value: "GREYMatchers"
      },
      method: "detoxMatcherForNot:",
      args: [matcher]
    };
  }

  static detoxMatcherForClass(aClassName) {
    if (typeof aClassName !== "string") throw new Error("aClassName should be a string, but got " + (aClassName + (" (" + (typeof aClassName + ")"))));
    return {
      target: {
        type: "Class",
        value: "GREYMatchers"
      },
      method: "detoxMatcherForClass:",
      args: [{
        type: "NSString",
        value: aClassName
      }]
    };
  }

}

module.exports = GREYMatchers;