/**

	This code is generated.
	For more information see generation/README.md.
*/



class DetoxWebAssertion {
  static assertHasText(webInteraction, text) {
    if (typeof text !== "string") throw new Error("text should be a string, but got " + (text + (" (" + (typeof text + ")"))));
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.web.DetoxWebAssertion"
      },
      method: "assertHasText",
      args: [{
        type: "Invocation",
        value: webInteraction
      }, text]
    };
  }

}

module.exports = DetoxWebAssertion;