/**

	This code is generated.
	For more information see generation/README.md.
*/



class EspressoDetox {
  static perform(interaction, action) {
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.EspressoDetox"
      },
      method: "perform",
      args: [{
        type: "Invocation",
        value: interaction
      }, action]
    };
  }

  static changeOrientation(orientation) {
    if (typeof orientation !== "number") throw new Error("orientation should be a number, but got " + (orientation + (" (" + (typeof orientation + ")"))));
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.EspressoDetox"
      },
      method: "changeOrientation",
      args: [{
        type: "Integer",
        value: orientation
      }]
    };
  }

  static setSynchronization(enabled) {
    if (typeof enabled !== "boolean") throw new Error("enabled should be a boolean, but got " + (enabled + (" (" + (typeof enabled + ")"))));
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.EspressoDetox"
      },
      method: "setSynchronization",
      args: [{
        type: "boolean",
        value: enabled
      }]
    };
  }

  static setURLBlacklist(urls) {
    if (typeof urls !== 'object' || !urls instanceof Array) {
      throw new Error('urls must be an array, got ' + typeof urls);
    }

    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.EspressoDetox"
      },
      method: "setURLBlacklist",
      args: [urls]
    };
  }

  static getBusyEspressoResources() {
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.EspressoDetox"
      },
      method: "getBusyEspressoResources",
      args: []
    };
  }

  static run(element) {
    return {
      target: element,
      method: "run",
      args: []
    };
  }

  static waitForComplete(element) {
    return {
      target: element,
      method: "waitForComplete",
      args: []
    };
  }

}

module.exports = EspressoDetox;