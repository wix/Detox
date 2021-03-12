/**

	This code is generated.
	For more information see generation/README.md.
*/



class UiDevice {
  static setCompressedLayoutHeirarchy(element, compressed) {
    if (typeof compressed !== "boolean") throw new Error("compressed should be a boolean, but got " + (compressed + (" (" + (typeof compressed + ")"))));
    return {
      target: element,
      method: "setCompressedLayoutHeirarchy",
      args: [{
        type: "boolean",
        value: compressed
      }]
    };
  }

  static getInstance() {
    return {
      target: {
        type: "Class",
        value: "com.android.uiautomator.core.UiDevice"
      },
      method: "getInstance",
      args: []
    };
  }

  static getDisplaySizeDp(element) {
    return {
      target: element,
      method: "getDisplaySizeDp",
      args: []
    };
  }

  static getProductName(element) {
    return {
      target: element,
      method: "getProductName",
      args: []
    };
  }

  static getLastTraversedText(element) {
    return {
      target: element,
      method: "getLastTraversedText",
      args: []
    };
  }

  static clearLastTraversedText(element) {
    return {
      target: element,
      method: "clearLastTraversedText",
      args: []
    };
  }

  static pressMenu(element) {
    return {
      target: element,
      method: "pressMenu",
      args: []
    };
  }

  static pressBack(element) {
    return {
      target: element,
      method: "pressBack",
      args: []
    };
  }

  static pressHome(element) {
    return {
      target: element,
      method: "pressHome",
      args: []
    };
  }

  static pressSearch(element) {
    return {
      target: element,
      method: "pressSearch",
      args: []
    };
  }

  static pressDPadCenter(element) {
    return {
      target: element,
      method: "pressDPadCenter",
      args: []
    };
  }

  static pressDPadDown(element) {
    return {
      target: element,
      method: "pressDPadDown",
      args: []
    };
  }

  static pressDPadUp(element) {
    return {
      target: element,
      method: "pressDPadUp",
      args: []
    };
  }

  static pressDPadLeft(element) {
    return {
      target: element,
      method: "pressDPadLeft",
      args: []
    };
  }

  static pressDPadRight(element) {
    return {
      target: element,
      method: "pressDPadRight",
      args: []
    };
  }

  static pressDelete(element) {
    return {
      target: element,
      method: "pressDelete",
      args: []
    };
  }

  static pressEnter(element) {
    return {
      target: element,
      method: "pressEnter",
      args: []
    };
  }

  static pressKeyCode(element, keyCode) {
    function pressKeyCode1(keyCode) {
      if (typeof keyCode !== "number") throw new Error("keyCode should be a number, but got " + (keyCode + (" (" + (typeof keyCode + ")"))));
      return {
        target: element,
        method: "pressKeyCode",
        args: [{
          type: "Integer",
          value: keyCode
        }]
      };
    }

    function pressKeyCode2(keyCode, metaState) {
      if (typeof keyCode !== "number") throw new Error("keyCode should be a number, but got " + (keyCode + (" (" + (typeof keyCode + ")"))));
      if (typeof metaState !== "number") throw new Error("metaState should be a number, but got " + (metaState + (" (" + (typeof metaState + ")"))));
      return {
        target: element,
        method: "pressKeyCode",
        args: [{
          type: "Integer",
          value: keyCode
        }, {
          type: "Integer",
          value: metaState
        }]
      };
    }

    if (arguments.length === 1) {
      return pressKeyCode1.apply(null, arguments);
    }

    if (arguments.length === 2) {
      return pressKeyCode2.apply(null, arguments);
    }
  }

  static pressRecentApps(element) {
    return {
      target: element,
      method: "pressRecentApps",
      args: []
    };
  }

  static openNotification(element) {
    return {
      target: element,
      method: "openNotification",
      args: []
    };
  }

  static openQuickSettings(element) {
    return {
      target: element,
      method: "openQuickSettings",
      args: []
    };
  }

  static getDisplayWidth(element) {
    return {
      target: element,
      method: "getDisplayWidth",
      args: []
    };
  }

  static getDisplayHeight(element) {
    return {
      target: element,
      method: "getDisplayHeight",
      args: []
    };
  }

  static click(element, x, y) {
    if (typeof x !== "number") throw new Error("x should be a number, but got " + (x + (" (" + (typeof x + ")"))));
    if (typeof y !== "number") throw new Error("y should be a number, but got " + (y + (" (" + (typeof y + ")"))));
    return {
      target: element,
      method: "click",
      args: [{
        type: "Integer",
        value: x
      }, {
        type: "Integer",
        value: y
      }]
    };
  }

  static swipe(element, startX, startY, endX, endY, steps) {
    if (typeof startX !== "number") throw new Error("startX should be a number, but got " + (startX + (" (" + (typeof startX + ")"))));
    if (typeof startY !== "number") throw new Error("startY should be a number, but got " + (startY + (" (" + (typeof startY + ")"))));
    if (typeof endX !== "number") throw new Error("endX should be a number, but got " + (endX + (" (" + (typeof endX + ")"))));
    if (typeof endY !== "number") throw new Error("endY should be a number, but got " + (endY + (" (" + (typeof endY + ")"))));
    if (typeof steps !== "number") throw new Error("steps should be a number, but got " + (steps + (" (" + (typeof steps + ")"))));
    return {
      target: element,
      method: "swipe",
      args: [{
        type: "Integer",
        value: startX
      }, {
        type: "Integer",
        value: startY
      }, {
        type: "Integer",
        value: endX
      }, {
        type: "Integer",
        value: endY
      }, {
        type: "Integer",
        value: steps
      }]
    };
  }

  static drag(element, startX, startY, endX, endY, steps) {
    if (typeof startX !== "number") throw new Error("startX should be a number, but got " + (startX + (" (" + (typeof startX + ")"))));
    if (typeof startY !== "number") throw new Error("startY should be a number, but got " + (startY + (" (" + (typeof startY + ")"))));
    if (typeof endX !== "number") throw new Error("endX should be a number, but got " + (endX + (" (" + (typeof endX + ")"))));
    if (typeof endY !== "number") throw new Error("endY should be a number, but got " + (endY + (" (" + (typeof endY + ")"))));
    if (typeof steps !== "number") throw new Error("steps should be a number, but got " + (steps + (" (" + (typeof steps + ")"))));
    return {
      target: element,
      method: "drag",
      args: [{
        type: "Integer",
        value: startX
      }, {
        type: "Integer",
        value: startY
      }, {
        type: "Integer",
        value: endX
      }, {
        type: "Integer",
        value: endY
      }, {
        type: "Integer",
        value: steps
      }]
    };
  }

  static waitForIdle(element) {
    return {
      target: element,
      method: "waitForIdle",
      args: []
    };
  }

  static getCurrentActivityName(element) {
    return {
      target: element,
      method: "getCurrentActivityName",
      args: []
    };
  }

  static getCurrentPackageName(element) {
    return {
      target: element,
      method: "getCurrentPackageName",
      args: []
    };
  }

  static removeWatcher(element, name) {
    if (typeof name !== "string") throw new Error("name should be a string, but got " + (name + (" (" + (typeof name + ")"))));
    return {
      target: element,
      method: "removeWatcher",
      args: [name]
    };
  }

  static runWatchers(element) {
    return {
      target: element,
      method: "runWatchers",
      args: []
    };
  }

  static resetWatcherTriggers(element) {
    return {
      target: element,
      method: "resetWatcherTriggers",
      args: []
    };
  }

  static hasWatcherTriggered(element, watcherName) {
    if (typeof watcherName !== "string") throw new Error("watcherName should be a string, but got " + (watcherName + (" (" + (typeof watcherName + ")"))));
    return {
      target: element,
      method: "hasWatcherTriggered",
      args: [watcherName]
    };
  }

  static hasAnyWatcherTriggered(element) {
    return {
      target: element,
      method: "hasAnyWatcherTriggered",
      args: []
    };
  }

  static setWatcherTriggered(element, watcherName) {
    if (typeof watcherName !== "string") throw new Error("watcherName should be a string, but got " + (watcherName + (" (" + (typeof watcherName + ")"))));
    return {
      target: element,
      method: "setWatcherTriggered",
      args: [watcherName]
    };
  }

  static isNaturalOrientation(element) {
    return {
      target: element,
      method: "isNaturalOrientation",
      args: []
    };
  }

  static getDisplayRotation(element) {
    return {
      target: element,
      method: "getDisplayRotation",
      args: []
    };
  }

  static freezeRotation(element) {
    return {
      target: element,
      method: "freezeRotation",
      args: []
    };
  }

  static unfreezeRotation(element) {
    return {
      target: element,
      method: "unfreezeRotation",
      args: []
    };
  }

  static setOrientationLeft(element) {
    return {
      target: element,
      method: "setOrientationLeft",
      args: []
    };
  }

  static setOrientationRight(element) {
    return {
      target: element,
      method: "setOrientationRight",
      args: []
    };
  }

  static setOrientationNatural(element) {
    return {
      target: element,
      method: "setOrientationNatural",
      args: []
    };
  }

  static wakeUp(element) {
    return {
      target: element,
      method: "wakeUp",
      args: []
    };
  }

  static isScreenOn(element) {
    return {
      target: element,
      method: "isScreenOn",
      args: []
    };
  }

  static sleep(element) {
    return {
      target: element,
      method: "sleep",
      args: []
    };
  }

  static dumpWindowHierarchy(element, fileName) {
    if (typeof fileName !== "string") throw new Error("fileName should be a string, but got " + (fileName + (" (" + (typeof fileName + ")"))));
    return {
      target: element,
      method: "dumpWindowHierarchy",
      args: [fileName]
    };
  }

}

module.exports = UiDevice;