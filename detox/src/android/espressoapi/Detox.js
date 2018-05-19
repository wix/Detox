/**

	This code is generated.
	For more information see generation/README.md.
*/



class DetoxTest {
  static setUpCustomEspressoIdlingResources(element) {
    return {
      target: {
        type: "Invocation",
        value: element
      },
      method: "setUpCustomEspressoIdlingResources",
      args: []
    };
  }

  static runDetoxTests(element) {
    return {
      target: {
        type: "Invocation",
        value: element
      },
      method: "runDetoxTests",
      args: []
    };
  }

  static startActivityFromUrl(url) {
    if (typeof url !== "string") throw new Error("url should be a string, but got " + (url + (" (" + (typeof url + ")"))));
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.DetoxTest"
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
        value: "com.wix.detox.DetoxTest"
      },
      method: "intentWithUrl",
      args: [url]
    };
  }

  static launchMainActivity() {
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.DetoxTest"
      },
      method: "launchMainActivity",
      args: []
    };
  }

}

module.exports = DetoxTest;