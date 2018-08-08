/**

	This code is generated.
	For more information see generation/README.md.
*/


const log = require('../../utils/logger').child({ __filename });
    const util = require('util')
    
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
        value: "android.support.test.espresso.action.ViewActions"
      },
      method: "clearGlobalAssertions",
      args: []
    };
  }

  static actionWithAssertions(viewAction) {
    return {
      target: {
        type: "Class",
        value: "android.support.test.espresso.action.ViewActions"
      },
      method: "actionWithAssertions",
      args: [{
        type: "ViewAction",
        value: viewAction
      }]
    };
  }

  static clearText() {
    return {
      target: {
        type: "Class",
        value: "android.support.test.espresso.action.ViewActions"
      },
      method: "clearText",
      args: []
    };
  }

  static click() {
    return {
      target: {
        type: "Class",
        value: "android.support.test.espresso.action.ViewActions"
      },
      method: "click",
      args: []
    };
  }

  static click(rollbackAction) {
    return {
      target: {
        type: "Class",
        value: "android.support.test.espresso.action.ViewActions"
      },
      method: "click",
      args: [{
        type: "ViewAction",
        value: rollbackAction
      }]
    };
  }

  static swipeLeft() {
    return {
      target: {
        type: "Class",
        value: "android.support.test.espresso.action.ViewActions"
      },
      method: "swipeLeft",
      args: []
    };
  }

  static swipeRight() {
    return {
      target: {
        type: "Class",
        value: "android.support.test.espresso.action.ViewActions"
      },
      method: "swipeRight",
      args: []
    };
  }

  static swipeDown() {
    return {
      target: {
        type: "Class",
        value: "android.support.test.espresso.action.ViewActions"
      },
      method: "swipeDown",
      args: []
    };
  }

  static swipeUp() {
    return {
      target: {
        type: "Class",
        value: "android.support.test.espresso.action.ViewActions"
      },
      method: "swipeUp",
      args: []
    };
  }

  static closeSoftKeyboard() {
    return {
      target: {
        type: "Class",
        value: "android.support.test.espresso.action.ViewActions"
      },
      method: "closeSoftKeyboard",
      args: []
    };
  }

  static pressImeActionButton() {
    return {
      target: {
        type: "Class",
        value: "android.support.test.espresso.action.ViewActions"
      },
      method: "pressImeActionButton",
      args: []
    };
  }

  static pressBack() {
    return {
      target: {
        type: "Class",
        value: "android.support.test.espresso.action.ViewActions"
      },
      method: "pressBack",
      args: []
    };
  }

  static pressMenuKey() {
    return {
      target: {
        type: "Class",
        value: "android.support.test.espresso.action.ViewActions"
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
        value: "android.support.test.espresso.action.ViewActions"
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
        value: "android.support.test.espresso.action.ViewActions"
      },
      method: "doubleClick",
      args: []
    };
  }

  static longClick() {
    return {
      target: {
        type: "Class",
        value: "android.support.test.espresso.action.ViewActions"
      },
      method: "longClick",
      args: []
    };
  }

  static scrollTo() {
    return {
      target: {
        type: "Class",
        value: "android.support.test.espresso.action.ViewActions"
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
        value: "android.support.test.espresso.action.ViewActions"
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
        value: "android.support.test.espresso.action.ViewActions"
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
        value: "android.support.test.espresso.action.ViewActions"
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
        value: "android.support.test.espresso.action.ViewActions"
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
        value: "android.support.test.espresso.action.ViewActions"
      },
      method: "openLinkWithUri",
      args: [uri]
    };
  }

  static repeatedlyUntil(action, desiredStateMatcher, maxAttempts) {
    if (typeof desiredStateMatcher !== 'object' || typeof desiredStateMatcher.constructor !== 'function' || desiredStateMatcher.constructor.name.indexOf('Matcher') === -1) {
      const isObject = typeof desiredStateMatcher === 'object';
      const additionalErrorInfo = isObject ? typeof desiredStateMatcher.constructor === 'object' ? 'the constructor is no object' : 'it has a wrong class name: "' + desiredStateMatcher.constructor.name + '"' : 'it is no object';
      log.error({
        event: "repeatedlyUntil",
        err: util.inspect(desiredStateMatcher)
      }, 'desiredStateMatcher should be an instance of Matcher, got "' + desiredStateMatcher + '", it appears that ' + additionalErrorInfo);
    }

    if (typeof maxAttempts !== "number") throw new Error("maxAttempts should be a number, but got " + (maxAttempts + (" (" + (typeof maxAttempts + ")"))));
    return {
      target: {
        type: "Class",
        value: "android.support.test.espresso.action.ViewActions"
      },
      method: "repeatedlyUntil",
      args: [{
        type: "ViewAction",
        value: action
      }, {
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