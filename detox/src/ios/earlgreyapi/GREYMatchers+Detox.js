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

function sanitize_uiAccessibilityTraits(value) {
  let traits = 0;
  for (let i = 0; i < value.length; i++) {
    switch (value[i]) {
      case 'button': traits |= 1; break;
      case 'link': traits |= 2; break;
      case 'header': traits |= 4; break;
      case 'search': traits |= 8; break;
      case 'image': traits |= 16; break;
      case 'selected': traits |= 32; break;
      case 'plays': traits |= 64; break;
      case 'key': traits |= 128; break;
      case 'text': traits |= 256; break;
      case 'summary': traits |= 512; break;
      case 'disabled': traits |= 1024; break;
      case 'frequentUpdates': traits |= 2048; break;
      case 'startsMedia': traits |= 4096; break;
      case 'adjustable': traits |= 8192; break;
      case 'allowsDirectInteraction': traits |= 16384; break;
      case 'pageTurn': traits |= 32768; break;
      default: throw new Error(`Unknown trait '${value[i]}', see list in https://facebook.github.io/react-native/docs/accessibility.html#accessibilitytraits-ios`);
    }
  }

  return traits;
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

  static detox_matcherForAccessibilityLabel(label) {
    if (typeof label !== "string") throw new Error("label should be a string, but got " + (label + (" (" + (typeof label + ")"))));
    return {
      target: {
        type: "Class",
        value: "GREYMatchers"
      },
      method: "detox_matcherForAccessibilityLabel:",
      args: [{
        type: "NSString",
        value: label
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