/**

	This code is generated.
	For more information see generation/README.md.
*/



class WebElement {
  static tap(element) {
    return {
      target: element,
      method: "tap",
      args: []
    };
  }

  static typeText(element, text) {
    if (typeof text !== "string") throw new Error("text should be a string, but got " + (text + (" (" + (typeof text + ")"))));
    return {
      target: element,
      method: "typeText",
      args: [text]
    };
  }

  static replaceText(element, text) {
    if (typeof text !== "string") throw new Error("text should be a string, but got " + (text + (" (" + (typeof text + ")"))));
    return {
      target: element,
      method: "replaceText",
      args: [text]
    };
  }

  static clearText(element) {
    return {
      target: element,
      method: "clearText",
      args: []
    };
  }

  static scrollToView(element) {
    return {
      target: element,
      method: "scrollToView",
      args: []
    };
  }

  static getText(element) {
    return {
      target: element,
      method: "getText",
      args: []
    };
  }

  static runScript(element, script) {
    if (typeof script !== "string") throw new Error("script should be a string, but got " + (script + (" (" + (typeof script + ")"))));
    return {
      target: element,
      method: "runScript",
      args: [script]
    };
  }

  static runScriptWithArgs(element, script, args) {
    if (typeof script !== "string") throw new Error("script should be a string, but got " + (script + (" (" + (typeof script + ")"))));

    if (typeof args !== 'object' || !args instanceof Array) {
      throw new Error('args must be an array, got ' + typeof args);
    }

    return {
      target: element,
      method: "runScriptWithArgs",
      args: [script, {
        type: "ArrayList<Object>",
        value: args
      }]
    };
  }

  static getCurrentUrl(element) {
    return {
      target: element,
      method: "getCurrentUrl",
      args: []
    };
  }

  static getTitle(element) {
    return {
      target: element,
      method: "getTitle",
      args: []
    };
  }

}

module.exports = WebElement;