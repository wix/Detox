/**

	This code is generated.
	For more information see generation/README.md.
*/



class DetoxViewActions {
  static getConstraints(element) {
    return {
      target: element,
      method: "getConstraints",
      args: []
    };
  }

  static getDescription(element) {
    return {
      target: element,
      method: "getDescription",
      args: []
    };
  }

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

}

module.exports = DetoxViewActions;