/**

	This code is generated.
	For more information see generation/README.md.
*/


function sanitize_matcher(matcher) {
  if (!matcher._call) {
    return matcher;
  }

  const originalMatcher = typeof matcher._call === 'function' ? matcher._call() : matcher._call;
  return originalMatcher.type ? originalMatcher.value : originalMatcher;
} 
class EspressoDetox {
  static perform(matcher, action) {
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.EspressoDetox"
      },
      method: "perform",
      args: [{
        type: "Invocation",
        value: sanitize_matcher(matcher)
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
    if (typeof urls !== 'object' || !Array.isArray(urls)) {
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

}

module.exports = EspressoDetox;