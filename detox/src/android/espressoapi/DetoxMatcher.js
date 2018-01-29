/**

	This code is generated.
	For more information see generation/README.md.
*/



class DetoxMatcher {
  static matcherForText(text) {
    if (typeof text !== "string") throw new Error("text should be a string, but got " + (text + (" (" + (typeof text + ")"))));
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.DetoxMatcher"
      },
      method: "matcherForText",
      args: [{
        type: "String",
        value: text
      }]
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
      args: [{
        type: "String",
        value: contentDescription
      }]
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
      args: [{
        type: "String",
        value: testId
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
      args: [{
        type: "String",
        value: className
      }]
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