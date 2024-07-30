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

  static tap(x, y) {
    if (typeof x !== "number") throw new Error("x should be a number, but got " + (x + (" (" + (typeof x + ")"))));
    if (typeof y !== "number") throw new Error("y should be a number, but got " + (y + (" (" + (typeof y + ")"))));
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.EspressoDetox"
      },
      method: "tap",
      args: [{
        type: "Integer",
        value: x
      }, {
        type: "Integer",
        value: y
      }]
    };
  }

  static longPress(x, y) {
    function longPress2(x, y) {
      if (typeof x !== "number") throw new Error("x should be a number, but got " + (x + (" (" + (typeof x + ")"))));
      if (typeof y !== "number") throw new Error("y should be a number, but got " + (y + (" (" + (typeof y + ")"))));
      return {
        target: {
          type: "Class",
          value: "com.wix.detox.espresso.EspressoDetox"
        },
        method: "longPress",
        args: [{
          type: "Integer",
          value: x
        }, {
          type: "Integer",
          value: y
        }]
      };
    }

    function longPress3(x, y, duration) {
      if (typeof x !== "number") throw new Error("x should be a number, but got " + (x + (" (" + (typeof x + ")"))));
      if (typeof y !== "number") throw new Error("y should be a number, but got " + (y + (" (" + (typeof y + ")"))));
      if (typeof duration !== "number") throw new Error("duration should be a number, but got " + (duration + (" (" + (typeof duration + ")"))));
      return {
        target: {
          type: "Class",
          value: "com.wix.detox.espresso.EspressoDetox"
        },
        method: "longPress",
        args: [{
          type: "Integer",
          value: x
        }, {
          type: "Integer",
          value: y
        }, {
          type: "Integer",
          value: duration
        }]
      };
    }

    if (arguments.length === 2) {
      return longPress2.apply(null, arguments);
    }

    if (arguments.length === 3) {
      return longPress3.apply(null, arguments);
    }
  }

}

module.exports = EspressoDetox;