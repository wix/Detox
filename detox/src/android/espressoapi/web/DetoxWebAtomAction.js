/**

	This code is generated.
	For more information see generation/README.md.
*/



class DetoxWebAtomAction {
  static click() {
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.web.DetoxWebAtomAction"
      },
      method: "click",
      args: []
    };
  }

  static typeText(text) {
    if (typeof text !== "string") throw new Error("text should be a string, but got " + (text + (" (" + (typeof text + ")"))));
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.web.DetoxWebAtomAction"
      },
      method: "typeText",
      args: [text]
    };
  }

  static replaceText(text) {
    if (typeof text !== "string") throw new Error("text should be a string, but got " + (text + (" (" + (typeof text + ")"))));
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.web.DetoxWebAtomAction"
      },
      method: "replaceText",
      args: [text]
    };
  }

  static clearText() {
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.web.DetoxWebAtomAction"
      },
      method: "clearText",
      args: []
    };
  }

  static scrollToView() {
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.web.DetoxWebAtomAction"
      },
      method: "scrollToView",
      args: []
    };
  }

  static getText() {
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.web.DetoxWebAtomAction"
      },
      method: "getText",
      args: []
    };
  }

  static runScript(script) {
    if (typeof script !== "string") throw new Error("script should be a string, but got " + (script + (" (" + (typeof script + ")"))));
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.web.DetoxWebAtomAction"
      },
      method: "runScript",
      args: [script]
    };
  }

  static runScriptWithArgs(script, args) {
    if (typeof script !== "string") throw new Error("script should be a string, but got " + (script + (" (" + (typeof script + ")"))));

    if (typeof args !== 'object' || !args instanceof Array) {
      throw new Error('args must be an array, got ' + typeof args);
    }

    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.web.DetoxWebAtomAction"
      },
      method: "runScriptWithArgs",
      args: [script, {
        type: "ArrayList<Object>",
        value: args
      }]
    };
  }

  static getCurrentUrl() {
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.web.DetoxWebAtomAction"
      },
      method: "getCurrentUrl",
      args: []
    };
  }

  static getTitle() {
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.web.DetoxWebAtomAction"
      },
      method: "getTitle",
      args: []
    };
  }

}

module.exports = DetoxWebAtomAction;