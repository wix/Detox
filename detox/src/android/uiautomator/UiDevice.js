/**

	This code is generated.
	For more information see generation/README.md.
*/



class UiDevice {
  setCompressedLayoutHeirarchy(compressed) {
    if (typeof compressed !== "boolean") throw new Error("compressed should be a boolean, but got " + (compressed + (" (" + (typeof compressed + ")"))));
    return {
      target: {
        type: "Class",
        value: "com.android.uiautomator.core.UiDevice"
      },
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

  getDisplaySizeDp() {
    return {
      target: {
        type: "Class",
        value: "com.android.uiautomator.core.UiDevice"
      },
      method: "getDisplaySizeDp",
      args: []
    };
  }

  getProductName() {
    return {
      target: {
        type: "Class",
        value: "com.android.uiautomator.core.UiDevice"
      },
      method: "getProductName",
      args: []
    };
  }

  getLastTraversedText() {
    return {
      target: {
        type: "Class",
        value: "com.android.uiautomator.core.UiDevice"
      },
      method: "getLastTraversedText",
      args: []
    };
  }

  clearLastTraversedText() {
    return {
      target: {
        type: "Class",
        value: "com.android.uiautomator.core.UiDevice"
      },
      method: "clearLastTraversedText",
      args: []
    };
  }

  pressMenu() {
    return {
      target: {
        type: "Class",
        value: "com.android.uiautomator.core.UiDevice"
      },
      method: "pressMenu",
      args: []
    };
  }

  pressBack() {
    return {
      target: {
        type: "Class",
        value: "com.android.uiautomator.core.UiDevice"
      },
      method: "pressBack",
      args: []
    };
  }

  pressHome() {
    return {
      target: {
        type: "Class",
        value: "com.android.uiautomator.core.UiDevice"
      },
      method: "pressHome",
      args: []
    };
  }

  pressSearch() {
    return {
      target: {
        type: "Class",
        value: "com.android.uiautomator.core.UiDevice"
      },
      method: "pressSearch",
      args: []
    };
  }

  pressDPadCenter() {
    return {
      target: {
        type: "Class",
        value: "com.android.uiautomator.core.UiDevice"
      },
      method: "pressDPadCenter",
      args: []
    };
  }

  pressDPadDown() {
    return {
      target: {
        type: "Class",
        value: "com.android.uiautomator.core.UiDevice"
      },
      method: "pressDPadDown",
      args: []
    };
  }

  pressDPadUp() {
    return {
      target: {
        type: "Class",
        value: "com.android.uiautomator.core.UiDevice"
      },
      method: "pressDPadUp",
      args: []
    };
  }

  pressDPadLeft() {
    return {
      target: {
        type: "Class",
        value: "com.android.uiautomator.core.UiDevice"
      },
      method: "pressDPadLeft",
      args: []
    };
  }

  pressDPadRight() {
    return {
      target: {
        type: "Class",
        value: "com.android.uiautomator.core.UiDevice"
      },
      method: "pressDPadRight",
      args: []
    };
  }

  pressDelete() {
    return {
      target: {
        type: "Class",
        value: "com.android.uiautomator.core.UiDevice"
      },
      method: "pressDelete",
      args: []
    };
  }

  pressEnter() {
    return {
      target: {
        type: "Class",
        value: "com.android.uiautomator.core.UiDevice"
      },
      method: "pressEnter",
      args: []
    };
  }

  pressKeyCode(keyCode) {
    if (typeof keyCode !== "number") throw new Error("keyCode should be a number, but got " + (keyCode + (" (" + (typeof keyCode + ")"))));
    return {
      target: {
        type: "Class",
        value: "com.android.uiautomator.core.UiDevice"
      },
      method: "pressKeyCode",
      args: [{
        type: "Integer",
        value: keyCode
      }]
    };
  }

  pressKeyCode(keyCode, metaState) {
    if (typeof keyCode !== "number") throw new Error("keyCode should be a number, but got " + (keyCode + (" (" + (typeof keyCode + ")"))));
    if (typeof metaState !== "number") throw new Error("metaState should be a number, but got " + (metaState + (" (" + (typeof metaState + ")"))));
    return {
      target: {
        type: "Class",
        value: "com.android.uiautomator.core.UiDevice"
      },
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

  pressRecentApps() {
    return {
      target: {
        type: "Class",
        value: "com.android.uiautomator.core.UiDevice"
      },
      method: "pressRecentApps",
      args: []
    };
  }

  openNotification() {
    return {
      target: {
        type: "Class",
        value: "com.android.uiautomator.core.UiDevice"
      },
      method: "openNotification",
      args: []
    };
  }

  openQuickSettings() {
    return {
      target: {
        type: "Class",
        value: "com.android.uiautomator.core.UiDevice"
      },
      method: "openQuickSettings",
      args: []
    };
  }

  getDisplayWidth() {
    return {
      target: {
        type: "Class",
        value: "com.android.uiautomator.core.UiDevice"
      },
      method: "getDisplayWidth",
      args: []
    };
  }

  getDisplayHeight() {
    return {
      target: {
        type: "Class",
        value: "com.android.uiautomator.core.UiDevice"
      },
      method: "getDisplayHeight",
      args: []
    };
  }

  click(x, y) {
    if (typeof x !== "number") throw new Error("x should be a number, but got " + (x + (" (" + (typeof x + ")"))));
    if (typeof y !== "number") throw new Error("y should be a number, but got " + (y + (" (" + (typeof y + ")"))));
    return {
      target: {
        type: "Class",
        value: "com.android.uiautomator.core.UiDevice"
      },
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

  swipe(startX, startY, endX, endY, steps) {
    if (typeof startX !== "number") throw new Error("startX should be a number, but got " + (startX + (" (" + (typeof startX + ")"))));
    if (typeof startY !== "number") throw new Error("startY should be a number, but got " + (startY + (" (" + (typeof startY + ")"))));
    if (typeof endX !== "number") throw new Error("endX should be a number, but got " + (endX + (" (" + (typeof endX + ")"))));
    if (typeof endY !== "number") throw new Error("endY should be a number, but got " + (endY + (" (" + (typeof endY + ")"))));
    if (typeof steps !== "number") throw new Error("steps should be a number, but got " + (steps + (" (" + (typeof steps + ")"))));
    return {
      target: {
        type: "Class",
        value: "com.android.uiautomator.core.UiDevice"
      },
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

  drag(startX, startY, endX, endY, steps) {
    if (typeof startX !== "number") throw new Error("startX should be a number, but got " + (startX + (" (" + (typeof startX + ")"))));
    if (typeof startY !== "number") throw new Error("startY should be a number, but got " + (startY + (" (" + (typeof startY + ")"))));
    if (typeof endX !== "number") throw new Error("endX should be a number, but got " + (endX + (" (" + (typeof endX + ")"))));
    if (typeof endY !== "number") throw new Error("endY should be a number, but got " + (endY + (" (" + (typeof endY + ")"))));
    if (typeof steps !== "number") throw new Error("steps should be a number, but got " + (steps + (" (" + (typeof steps + ")"))));
    return {
      target: {
        type: "Class",
        value: "com.android.uiautomator.core.UiDevice"
      },
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

  waitForIdle() {
    return {
      target: {
        type: "Class",
        value: "com.android.uiautomator.core.UiDevice"
      },
      method: "waitForIdle",
      args: []
    };
  }

  getCurrentActivityName() {
    return {
      target: {
        type: "Class",
        value: "com.android.uiautomator.core.UiDevice"
      },
      method: "getCurrentActivityName",
      args: []
    };
  }

  getCurrentPackageName() {
    return {
      target: {
        type: "Class",
        value: "com.android.uiautomator.core.UiDevice"
      },
      method: "getCurrentPackageName",
      args: []
    };
  }

  removeWatcher(name) {
    if (typeof name !== "string") throw new Error("name should be a string, but got " + (name + (" (" + (typeof name + ")"))));
    return {
      target: {
        type: "Class",
        value: "com.android.uiautomator.core.UiDevice"
      },
      method: "removeWatcher",
      args: [name]
    };
  }

  runWatchers() {
    return {
      target: {
        type: "Class",
        value: "com.android.uiautomator.core.UiDevice"
      },
      method: "runWatchers",
      args: []
    };
  }

  resetWatcherTriggers() {
    return {
      target: {
        type: "Class",
        value: "com.android.uiautomator.core.UiDevice"
      },
      method: "resetWatcherTriggers",
      args: []
    };
  }

  hasWatcherTriggered(watcherName) {
    if (typeof watcherName !== "string") throw new Error("watcherName should be a string, but got " + (watcherName + (" (" + (typeof watcherName + ")"))));
    return {
      target: {
        type: "Class",
        value: "com.android.uiautomator.core.UiDevice"
      },
      method: "hasWatcherTriggered",
      args: [watcherName]
    };
  }

  hasAnyWatcherTriggered() {
    return {
      target: {
        type: "Class",
        value: "com.android.uiautomator.core.UiDevice"
      },
      method: "hasAnyWatcherTriggered",
      args: []
    };
  }

  setWatcherTriggered(watcherName) {
    if (typeof watcherName !== "string") throw new Error("watcherName should be a string, but got " + (watcherName + (" (" + (typeof watcherName + ")"))));
    return {
      target: {
        type: "Class",
        value: "com.android.uiautomator.core.UiDevice"
      },
      method: "setWatcherTriggered",
      args: [watcherName]
    };
  }

  isNaturalOrientation() {
    return {
      target: {
        type: "Class",
        value: "com.android.uiautomator.core.UiDevice"
      },
      method: "isNaturalOrientation",
      args: []
    };
  }

  getDisplayRotation() {
    return {
      target: {
        type: "Class",
        value: "com.android.uiautomator.core.UiDevice"
      },
      method: "getDisplayRotation",
      args: []
    };
  }

  freezeRotation() {
    return {
      target: {
        type: "Class",
        value: "com.android.uiautomator.core.UiDevice"
      },
      method: "freezeRotation",
      args: []
    };
  }

  unfreezeRotation() {
    return {
      target: {
        type: "Class",
        value: "com.android.uiautomator.core.UiDevice"
      },
      method: "unfreezeRotation",
      args: []
    };
  }

  setOrientationLeft() {
    return {
      target: {
        type: "Class",
        value: "com.android.uiautomator.core.UiDevice"
      },
      method: "setOrientationLeft",
      args: []
    };
  }

  setOrientationRight() {
    return {
      target: {
        type: "Class",
        value: "com.android.uiautomator.core.UiDevice"
      },
      method: "setOrientationRight",
      args: []
    };
  }

  setOrientationNatural() {
    return {
      target: {
        type: "Class",
        value: "com.android.uiautomator.core.UiDevice"
      },
      method: "setOrientationNatural",
      args: []
    };
  }

  wakeUp() {
    return {
      target: {
        type: "Class",
        value: "com.android.uiautomator.core.UiDevice"
      },
      method: "wakeUp",
      args: []
    };
  }

  isScreenOn() {
    return {
      target: {
        type: "Class",
        value: "com.android.uiautomator.core.UiDevice"
      },
      method: "isScreenOn",
      args: []
    };
  }

  sleep() {
    return {
      target: {
        type: "Class",
        value: "com.android.uiautomator.core.UiDevice"
      },
      method: "sleep",
      args: []
    };
  }

  dumpWindowHierarchy(fileName) {
    if (typeof fileName !== "string") throw new Error("fileName should be a string, but got " + (fileName + (" (" + (typeof fileName + ")"))));
    return {
      target: {
        type: "Class",
        value: "com.android.uiautomator.core.UiDevice"
      },
      method: "dumpWindowHierarchy",
      args: [fileName]
    };
  }

}

module.exports = UiDevice;