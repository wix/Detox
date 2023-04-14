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
class EspressoWebDetox {
  static getWebView() {
    function getWebView0() {
      return {
        target: {
          type: "Class",
          value: "com.wix.detox.espresso.web.EspressoWebDetox"
        },
        method: "getWebView",
        args: []
      };
    }

    function getWebView1(matcher) {
      return {
        target: {
          type: "Class",
          value: "com.wix.detox.espresso.web.EspressoWebDetox"
        },
        method: "getWebView",
        args: [{
          type: "Invocation",
          value: sanitize_matcher(matcher)
        }]
      };
    }

    if (arguments.length === 0) {
      return getWebView0.apply(null, arguments);
    }

    if (arguments.length === 1) {
      return getWebView1.apply(null, arguments);
    }
  }

  static expect(webElement) {
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.web.EspressoWebDetox"
      },
      method: "expect",
      args: [{
        type: "Invocation",
        value: webElement
      }]
    };
  }

}

module.exports = EspressoWebDetox;