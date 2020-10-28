/**

	This code is generated.
	For more information see generation/README.md.
*/



class DetoxViewActions {
  static click(strictMode) {
    if (typeof strictMode !== "boolean") throw new Error("strictMode should be a boolean, but got " + (strictMode + (" (" + (typeof strictMode + ")"))));
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.DetoxViewActions"
      },
      method: "click",
      args: [{
        type: "boolean",
        value: strictMode
      }]
    };
  }

  static typeText(text) {
    if (typeof text !== "string") throw new Error("text should be a string, but got " + (text + (" (" + (typeof text + ")"))));
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.DetoxViewActions"
      },
      method: "typeText",
      args: [text]
    };
  }

}

module.exports = DetoxViewActions;