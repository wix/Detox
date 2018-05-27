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

  static intentWithUrl(url) {
    if (typeof url !== "string") throw new Error("url should be a string, but got " + (url + (" (" + (typeof url + ")"))));
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.Detox"
      },
      method: "intentWithUrl",
      args: [url]
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

}

module.exports = Detox;