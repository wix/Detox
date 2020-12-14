/**

	This code is generated.
	For more information see generation/README.md.
*/



class WebViewElement {
  static element(element, matcher, index) {
    function element1(matcher) {
      return {
        target: element,
        method: "element",
        args: [{
          type: "Invocation",
          value: matcher
        }]
      };
    }

    function element2(matcher, index) {
      if (typeof index !== "number") throw new Error("index should be a number, but got " + (index + (" (" + (typeof index + ")"))));
      return {
        target: element,
        method: "element",
        args: [{
          type: "Invocation",
          value: matcher
        }, {
          type: "Integer",
          value: index
        }]
      };
    }

    if (arguments.length === 1) {
      return element1.apply(null, arguments);
    }

    if (arguments.length === 2) {
      return element2.apply(null, arguments);
    }
  }

}

module.exports = WebViewElement;