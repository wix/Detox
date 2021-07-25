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

  static scrollInDirection(direction, amountInDP, startOffsetPercentX, startOffsetPercentY) {
    if (typeof direction !== "string") throw new Error("direction should be a string, but got " + (direction + (" (" + (typeof direction + ")"))));
    if (typeof amountInDP !== "number") throw new Error("amountInDP should be a number, but got " + (amountInDP + (" (" + (typeof amountInDP + ")"))));
    if (typeof startOffsetPercentX !== "number") throw new Error("startOffsetPercentX should be a number, but got " + (startOffsetPercentX + (" (" + (typeof startOffsetPercentX + ")"))));
    if (typeof startOffsetPercentY !== "number") throw new Error("startOffsetPercentY should be a number, but got " + (startOffsetPercentY + (" (" + (typeof startOffsetPercentY + ")"))));
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
      }, {
        type: "Double",
        value: startOffsetPercentX
      }, {
        type: "Double",
        value: startOffsetPercentY
      }]
    };
  }

  static scrollInDirectionStaleAtEdge(direction, amountInDP, startOffsetPercentX, startOffsetPercentY) {
    if (typeof direction !== "string") throw new Error("direction should be a string, but got " + (direction + (" (" + (typeof direction + ")"))));
    if (typeof amountInDP !== "number") throw new Error("amountInDP should be a number, but got " + (amountInDP + (" (" + (typeof amountInDP + ")"))));
    if (typeof startOffsetPercentX !== "number") throw new Error("startOffsetPercentX should be a number, but got " + (startOffsetPercentX + (" (" + (typeof startOffsetPercentX + ")"))));
    if (typeof startOffsetPercentY !== "number") throw new Error("startOffsetPercentY should be a number, but got " + (startOffsetPercentY + (" (" + (typeof startOffsetPercentY + ")"))));
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
      }, {
        type: "Double",
        value: startOffsetPercentX
      }, {
        type: "Double",
        value: startOffsetPercentY
      }]
    };
  }

  static swipeInDirection(direction, fast, normalizedOffset, normalizedStartingPointX, normalizedStartingPointY) {
    if (typeof direction !== "string") throw new Error("direction should be a string, but got " + (direction + (" (" + (typeof direction + ")"))));
    if (typeof fast !== "boolean") throw new Error("fast should be a boolean, but got " + (fast + (" (" + (typeof fast + ")"))));
    if (typeof normalizedOffset !== "number") throw new Error("normalizedOffset should be a number, but got " + (normalizedOffset + (" (" + (typeof normalizedOffset + ")"))));
    if (typeof normalizedStartingPointX !== "number") throw new Error("normalizedStartingPointX should be a number, but got " + (normalizedStartingPointX + (" (" + (typeof normalizedStartingPointX + ")"))));
    if (typeof normalizedStartingPointY !== "number") throw new Error("normalizedStartingPointY should be a number, but got " + (normalizedStartingPointY + (" (" + (typeof normalizedStartingPointY + ")"))));
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
      }, {
        type: "Double",
        value: normalizedOffset
      }, {
        type: "Double",
        value: normalizedStartingPointX
      }, {
        type: "Double",
        value: normalizedStartingPointY
      }]
    };
  }

  static getAttributes() {
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.DetoxAction"
      },
      method: "getAttributes",
      args: []
    };
  }

  static scrollToIndex(index) {
    if (typeof index !== "number") throw new Error("index should be a number, but got " + (index + (" (" + (typeof index + ")"))));
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.DetoxAction"
      },
      method: "scrollToIndex",
      args: [{
        type: "Integer",
        value: index
      }]
    };
  }

  static adjustSliderToPosition(newPosition) {
    if (typeof newPosition !== "number") throw new Error("newPosition should be a number, but got " + (newPosition + (" (" + (typeof newPosition + ")"))));
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.DetoxAction"
      },
      method: "adjustSliderToPosition",
      args: [{
        type: "Double",
        value: newPosition
      }]
    };
  }

  static takeViewScreenshot() {
    return {
      target: {
        type: "Class",
        value: "com.wix.detox.espresso.DetoxAction"
      },
      method: "takeViewScreenshot",
      args: []
    };
  }

}

module.exports = DetoxAction;