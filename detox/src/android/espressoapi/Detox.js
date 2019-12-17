/**

	This code is generated.
	For more information see generation/README.md.
*/



class Detox {
  static setUpCustomEspressoIdlingResources(element) {
    return {
      target: element,
      method: "setUpCustomEspressoIdlingResources",
      args: []
    };
  }

  static runDetoxTests(element) {
    return {
      target: element,
      method: "runDetoxTests",
      args: []
    };
  }

  static launchMainActivity() {
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.Detox"
      },
      method: "launchMainActivity",
      args: []
    };
  }

  static startActivityFromUrl(url) {
    if (typeof url !== "string") throw new Error("url should be a string, but got " + (url + (" (" + (typeof url + ")"))));
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.Detox"
      },
      method: "startActivityFromUrl",
      args: [url]
    };
  }

  static extractInitialIntent() {
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.Detox"
      },
      method: "extractInitialIntent",
      args: []
    };
  }

  static cleanIntent() {
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.Detox"
      },
      method: "cleanIntent",
      args: []
    };
  }

  static intentWithUrl(url, initialLaunch) {
    if (typeof url !== "string") throw new Error("url should be a string, but got " + (url + (" (" + (typeof url + ")"))));
    if (typeof initialLaunch !== "boolean") throw new Error("initialLaunch should be a boolean, but got " + (initialLaunch + (" (" + (typeof initialLaunch + ")"))));
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.Detox"
      },
      method: "intentWithUrl",
      args: [url, {
        type: "boolean",
        value: initialLaunch
      }]
    };
  }

  static readLaunchArgs() {
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.Detox"
      },
      method: "readLaunchArgs",
      args: []
    };
  }

}

module.exports = Detox;