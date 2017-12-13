/**

	This code is generated.
	For more information see generation/README.md.
*/



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
    if (typeof edge !== "number") throw new Error("edge should be a number, but got " + (edge + (" (" + (typeof edge + ")"))));
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.DetoxAction"
      },
      method: "scrollToEdge",
      args: [{
        type: "Integer",
        value: edge
      }]
    };
  }

  static scrollInDirection(direction, amountInDP) {
    if (typeof direction !== "number") throw new Error("direction should be a number, but got " + (direction + (" (" + (typeof direction + ")"))));
    if (typeof amountInDP !== "number") throw new Error("amountInDP should be a number, but got " + (amountInDP + (" (" + (typeof amountInDP + ")"))));
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.DetoxAction"
      },
      method: "scrollInDirection",
      args: [{
        type: "Integer",
        value: direction
      }, {
        type: "double",
        value: amountInDP
      }]
    };
  }

}

module.exports = DetoxAction;