/**

	This code is generated.
	For more information see generation/README.md.
*/


function sanitize_android_edge(edge) {
  switch (edge) {
    case 'left':
      return 1;
    case 'right':
      return 2;
    case 'top':
      return 3;
    case 'bottom':
      return 4;
    default:
      throw new Error(`edge must be a 'left'/'right'/'top'/'bottom', got ${edge}`);
  }
} 
function sanitize_android_direction(direction) {
  switch (direction) {
    case 'left':
      return 1;
    case 'right':
      return 2;
    case 'up':
      return 3;
    case 'down':
      return 4;
    default:
      throw new Error(`direction must be a 'left'/'right'/'up'/'down', got ${direction}`);
  }
} 
class DetoxAction {
  static multiClick(times) {
    if (typeof times !== "number") throw new Error("times should be a number, but got " + (times + (" (" + (typeof times + ")"))));
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.DetoxAction"
      },
      method: "multiClick",
      args: [{
        type: "Integer",
        value: times
      }]
    };
  }

  static tapAtLocation(x, y) {
    if (typeof x !== "number") throw new Error("x should be a number, but got " + (x + (" (" + (typeof x + ")"))));
    if (typeof y !== "number") throw new Error("y should be a number, but got " + (y + (" (" + (typeof y + ")"))));
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.DetoxAction"
      },
      method: "tapAtLocation",
      args: [{
        type: "Integer",
        value: x
      }, {
        type: "Integer",
        value: y
      }]
    };
  }

  static scrollToEdge(edge) {
    if (typeof edge !== "string") throw new Error("edge should be a string, but got " + (edge + (" (" + (typeof edge + ")"))));
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.DetoxAction"
      },
      method: "scrollToEdge",
      args: [{
        type: "Integer",
        value: sanitize_android_edge(edge)
      }]
    };
  }

  static scrollInDirection(direction, amountInDP) {
    if (typeof direction !== "string") throw new Error("direction should be a string, but got " + (direction + (" (" + (typeof direction + ")"))));
    if (typeof amountInDP !== "number") throw new Error("amountInDP should be a number, but got " + (amountInDP + (" (" + (typeof amountInDP + ")"))));
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.DetoxAction"
      },
      method: "scrollInDirection",
      args: [{
        type: "Integer",
        value: sanitize_android_direction(direction)
      }, {
        type: "Double",
        value: amountInDP
      }]
    };
  }

  static scrollInDirectionStaleAtEdge(direction, amountInDP) {
    if (typeof direction !== "string") throw new Error("direction should be a string, but got " + (direction + (" (" + (typeof direction + ")"))));
    if (typeof amountInDP !== "number") throw new Error("amountInDP should be a number, but got " + (amountInDP + (" (" + (typeof amountInDP + ")"))));
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.DetoxAction"
      },
      method: "scrollInDirectionStaleAtEdge",
      args: [{
        type: "Integer",
        value: sanitize_android_direction(direction)
      }, {
        type: "Double",
        value: amountInDP
      }]
    };
  }

  static swipeInDirection(direction, fast) {
    if (typeof direction !== "string") throw new Error("direction should be a string, but got " + (direction + (" (" + (typeof direction + ")"))));
    if (typeof fast !== "boolean") throw new Error("fast should be a boolean, but got " + (fast + (" (" + (typeof fast + ")"))));
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.DetoxAction"
      },
      method: "swipeInDirection",
      args: [{
        type: "Integer",
        value: sanitize_android_direction(direction)
      }, {
        type: "boolean",
        value: fast
      }]
    };
  }

}

module.exports = DetoxAction;