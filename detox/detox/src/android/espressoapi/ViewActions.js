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
class ViewActions {
  static clearGlobalAssertions() {
    return {
      target: {
        type: "Class",
        value: "androidx.test.espresso.action.ViewActions"
      },
      method: "clearGlobalAssertions",
      args: []
    };
  }

  static actionWithAssertions(viewAction) {
    return {
      target: {
        type: "Class",
        value: "androidx.test.espresso.action.ViewActions"
      },
      method: "actionWithAssertions",
      args: [viewAction]
    };
  }

  static clearText() {
    return {
      target: {
        type: "Class",
        value: "androidx.test.espresso.action.ViewActions"
      },
      method: "clearText",
      args: []
    };
  }

  static click(inputDevice, buttonState) {
    function click2(inputDevice, buttonState) {
      if (typeof inputDevice !== "number") throw new Error("inputDevice should be a number, but got " + (inputDevice + (" (" + (typeof inputDevice + ")"))));
      if (typeof buttonState !== "number") throw new Error("buttonState should be a number, but got " + (buttonState + (" (" + (typeof buttonState + ")"))));
      return {
        target: {
          type: "Class",
          value: "androidx.test.espresso.action.ViewActions"
        },
        method: "click",
        args: [{
          type: "Integer",
          value: inputDevice
        }, {
          type: "Integer",
          value: buttonState
        }]
      };
    }

    function click0() {
      return {
        target: {
          type: "Class",
          value: "androidx.test.espresso.action.ViewActions"
        },
        method: "click",
        args: []
      };
    }

    function click1(rollbackAction) {
      return {
        target: {
          type: "Class",
          value: "androidx.test.espresso.action.ViewActions"
        },
        method: "click",
        args: [rollbackAction]
      };
    }

    if (arguments.length === 2) {
      return click2.apply(null, arguments);
    }

    if (arguments.length === 0) {
      return click0.apply(null, arguments);
    }

    if (arguments.length === 1) {
      return click1.apply(null, arguments);
    }
  }

  static swipeLeft() {
    return {
      target: {
        type: "Class",
        value: "androidx.test.espresso.action.ViewActions"
      },
      method: "swipeLeft",
      args: []
    };
  }

  static swipeRight() {
    return {
      target: {
        type: "Class",
        value: "androidx.test.espresso.action.ViewActions"
      },
      method: "swipeRight",
      args: []
    };
  }

  static swipeDown() {
    return {
      target: {
        type: "Class",
        value: "androidx.test.espresso.action.ViewActions"
      },
      method: "swipeDown",
      args: []
    };
  }

  static swipeUp() {
    return {
      target: {
        type: "Class",
        value: "androidx.test.espresso.action.ViewActions"
      },
      method: "swipeUp",
      args: []
    };
  }

  static closeSoftKeyboard() {
    return {
      target: {
        type: "Class",
        value: "androidx.test.espresso.action.ViewActions"
      },
      method: "closeSoftKeyboard",
      args: []
    };
  }

  static pressImeActionButton() {
    return {
      target: {
        type: "Class",
        value: "androidx.test.espresso.action.ViewActions"
      },
      method: "pressImeActionButton",
      args: []
    };
  }

  static pressBack() {
    return {
      target: {
        type: "Class",
        value: "androidx.test.espresso.action.ViewActions"
      },
      method: "pressBack",
      args: []
    };
  }

  static pressBackUnconditionally() {
    return {
      target: {
        type: "Class",
        value: "androidx.test.espresso.action.ViewActions"
      },
      method: "pressBackUnconditionally",
      args: []
    };
  }

  static pressMenuKey() {
    return {
      target: {
        type: "Class",
        value: "androidx.test.espresso.action.ViewActions"
      },
      method: "pressMenuKey",
      args: []
    };
  }

  static pressKey(keyCode) {
    if (typeof keyCode !== "number") throw new Error("keyCode should be a number, but got " + (keyCode + (" (" + (typeof keyCode + ")"))));
    return {
      target: {
        type: "Class",
        value: "androidx.test.espresso.action.ViewActions"
      },
      method: "pressKey",
      args: [{
        type: "Integer",
        value: keyCode
      }]
    };
  }

  static doubleClick() {
    return {
      target: {
        type: "Class",
        value: "androidx.test.espresso.action.ViewActions"
      },
      method: "doubleClick",
      args: []
    };
  }

  static longClick() {
    return {
      target: {
        type: "Class",
        value: "androidx.test.espresso.action.ViewActions"
      },
      method: "longClick",
      args: []
    };
  }

  static scrollTo() {
    return {
      target: {
        type: "Class",
        value: "androidx.test.espresso.action.ViewActions"
      },
      method: "scrollTo",
      args: []
    };
  }

  static typeTextIntoFocusedView(stringToBeTyped) {
    if (typeof stringToBeTyped !== "string") throw new Error("stringToBeTyped should be a string, but got " + (stringToBeTyped + (" (" + (typeof stringToBeTyped + ")"))));
    return {
      target: {
        type: "Class",
        value: "androidx.test.espresso.action.ViewActions"
      },
      method: "typeTextIntoFocusedView",
      args: [stringToBeTyped]
    };
  }

  static typeText(stringToBeTyped) {
    if (typeof stringToBeTyped !== "string") throw new Error("stringToBeTyped should be a string, but got " + (stringToBeTyped + (" (" + (typeof stringToBeTyped + ")"))));
    return {
      target: {
        type: "Class",
        value: "androidx.test.espresso.action.ViewActions"
      },
      method: "typeText",
      args: [stringToBeTyped]
    };
  }

  static replaceText(stringToBeSet) {
    if (typeof stringToBeSet !== "string") throw new Error("stringToBeSet should be a string, but got " + (stringToBeSet + (" (" + (typeof stringToBeSet + ")"))));
    return {
      target: {
        type: "Class",
        value: "androidx.test.espresso.action.ViewActions"
      },
      method: "replaceText",
      args: [stringToBeSet]
    };
  }

  static openLinkWithText(linkText) {
    if (typeof linkText !== "string") throw new Error("linkText should be a string, but got " + (linkText + (" (" + (typeof linkText + ")"))));
    return {
      target: {
        type: "Class",
        value: "androidx.test.espresso.action.ViewActions"
      },
      method: "openLinkWithText",
      args: [linkText]
    };
  }

  static openLinkWithUri(uri) {
    if (typeof uri !== "string") throw new Error("uri should be a string, but got " + (uri + (" (" + (typeof uri + ")"))));
    return {
      target: {
        type: "Class",
        value: "androidx.test.espresso.action.ViewActions"
      },
      method: "openLinkWithUri",
      args: [uri]
    };
  }

  static repeatedlyUntil(action, desiredStateMatcher, maxAttempts) {
    if (typeof maxAttempts !== "number") throw new Error("maxAttempts should be a number, but got " + (maxAttempts + (" (" + (typeof maxAttempts + ")"))));
    return {
      target: {
        type: "Class",
        value: "androidx.test.espresso.action.ViewActions"
      },
      method: "repeatedlyUntil",
      args: [action, {
        type: "Invocation",
        value: sanitize_matcher(desiredStateMatcher)
      }, {
        type: "Integer",
        value: maxAttempts
      }]
    };
  }

}

module.exports = ViewActions;