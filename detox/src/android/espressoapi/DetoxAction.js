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

function sanitize_uiAccessibilityTraits(value) {
  let traits = 0;
  for (let i = 0; i < value.length; i++) {
    switch (value[i]) {
      case 'button': traits |= 1; break;
      case 'link': traits |= 2; break;
      case 'header': traits |= 4; break;
      case 'search': traits |= 8; break;
      case 'image': traits |= 16; break;
      case 'selected': traits |= 32; break;
      case 'plays': traits |= 64; break;
      case 'key': traits |= 128; break;
      case 'text': traits |= 256; break;
      case 'summary': traits |= 512; break;
      case 'disabled': traits |= 1024; break;
      case 'frequentUpdates': traits |= 2048; break;
      case 'startsMedia': traits |= 4096; break;
      case 'adjustable': traits |= 8192; break;
      case 'allowsDirectInteraction': traits |= 16384; break;
      case 'pageTurn': traits |= 32768; break;
      default: throw new Error(`Unknown trait '${value[i]}', see list in https://facebook.github.io/react-native/docs/accessibility.html#accessibilitytraits-ios`);
    }
  }

  return traits;
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