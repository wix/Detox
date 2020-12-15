/**

	This code is generated.
	For more information see generation/README.md.
*/



class DetoxWebAtomMatcher {
  static matcherForId(id) {
    if (typeof id !== "string") throw new Error("id should be a string, but got " + (id + (" (" + (typeof id + ")"))));
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.web.DetoxWebAtomMatcher"
      },
      method: "matcherForId",
      args: [id]
    };
  }

  static matcherForClassName(className) {
    if (typeof className !== "string") throw new Error("className should be a string, but got " + (className + (" (" + (typeof className + ")"))));
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.web.DetoxWebAtomMatcher"
      },
      method: "matcherForClassName",
      args: [className]
    };
  }

  static matcherForCssSelector(cssSelector) {
    if (typeof cssSelector !== "string") throw new Error("cssSelector should be a string, but got " + (cssSelector + (" (" + (typeof cssSelector + ")"))));
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.web.DetoxWebAtomMatcher"
      },
      method: "matcherForCssSelector",
      args: [cssSelector]
    };
  }

  static matcherForName(name) {
    if (typeof name !== "string") throw new Error("name should be a string, but got " + (name + (" (" + (typeof name + ")"))));
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.web.DetoxWebAtomMatcher"
      },
      method: "matcherForName",
      args: [name]
    };
  }

  static matcherForXPath(xpath) {
    if (typeof xpath !== "string") throw new Error("xpath should be a string, but got " + (xpath + (" (" + (typeof xpath + ")"))));
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.web.DetoxWebAtomMatcher"
      },
      method: "matcherForXPath",
      args: [xpath]
    };
  }

  static matcherForLinkText(linkText) {
    if (typeof linkText !== "string") throw new Error("linkText should be a string, but got " + (linkText + (" (" + (typeof linkText + ")"))));
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.web.DetoxWebAtomMatcher"
      },
      method: "matcherForLinkText",
      args: [linkText]
    };
  }

  static matcherForPartialLinkText(partialLinkText) {
    if (typeof partialLinkText !== "string") throw new Error("partialLinkText should be a string, but got " + (partialLinkText + (" (" + (typeof partialLinkText + ")"))));
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.web.DetoxWebAtomMatcher"
      },
      method: "matcherForPartialLinkText",
      args: [partialLinkText]
    };
  }

  static matcherForTagName(tag) {
    if (typeof tag !== "string") throw new Error("tag should be a string, but got " + (tag + (" (" + (typeof tag + ")"))));
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.web.DetoxWebAtomMatcher"
      },
      method: "matcherForTagName",
      args: [tag]
    };
  }

}

module.exports = DetoxWebAtomMatcher;