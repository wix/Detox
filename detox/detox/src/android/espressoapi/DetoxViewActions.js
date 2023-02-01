/**

	This code is generated.
	For more information see generation/README.md.
*/



class DetoxViewActions {
  static click() {
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.DetoxViewActions"
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
        value: "com.wix.detox.espresso.DetoxViewActions"
      },
      method: "typeText",
      args: [text]
    };
  }

}

module.exports = DetoxViewActions;