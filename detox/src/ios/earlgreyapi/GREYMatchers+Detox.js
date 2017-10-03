/**

	This code is generated.
	For more information see generation/README.md.
*/


// Globally declared helpers

function sanitize_greyDirection(action) {
  switch (action) {
    case "left":
      return 1;
    case "right":
      return 2;
    case "up":
      return 3;
    case "down":
      return 4;
      
    default:
      throw new Error(`GREYAction.GREYDirection must be a 'left'/'right'/'up'/'down', got ${action}`);
  }
}

function sanitize_greyContentEdge(action) {
  switch (action) {
    case "left":
      return 0;
    case "right":
      return 1;
    case "top":
      return 2;
    case "bottom":
      return 3;

    default:
      throw new Error(`GREYAction.GREYContentEdge must be a 'left'/'right'/'top'/'bottom', got ${action}`);
  }
}



class GREYMatchers {
  static detoxMatcherForText(text) {
    if (typeof text !== "string") throw new Error("text should be a string, but got " + (text + (" (" + (typeof text + ")"))));
    return {
      target: {
        type: "Class",
        value: "GREYMatchers"
      },
      method: "detoxMatcherForText:",
      args: [{
        type: "NSString",
        value: text
      }]
    };
  }

  static detoxMatcherForClass(aClassName) {
    if (typeof aClassName !== "string") throw new Error("aClassName should be a string, but got " + (aClassName + (" (" + (typeof aClassName + ")"))));
    return {
      target: {
        type: "Class",
        value: "GREYMatchers"
      },
      method: "detoxMatcherForClass:",
      args: [{
        type: "NSString",
        value: aClassName
      }]
    };
  }

}

module.exports = GREYMatchers;