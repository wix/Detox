# The `device` Object

`device` is globally available in every test file, it enables control over the current attached device (currently only simulators are supported).

### Methods

- [`device.relaunchApp()`](#devicerelaunchapp)
- [`device.reloadReactNative()`](#devicereloadreactnative)
- [`device.installApp()`](#deviceinstallapp)
- [`device.uninstallApp()`](#deviceuninstallapp)
- [`device.openURL(url)`](#deviceopenurl)
- [`device.sendUserNotification(params)`](#devicesendusernotifications)

### `device.relaunchApp()`
Kill and relaunch the app defined in the current [`configuration`](APIRef.Configuration.md).



### `device.reloadReactNative()`
If this is a react native app, reload react native JS bundle. This action is much faster than `device.relaunchApp()`, and is recommended if you just need to reset your react native logic.

### `device.installApp()`
Install the app file defined in the current [`configuration`](APIRef.Configuration.md).

### `device.uninstallApp()`
Uninstall the app defined in the current [`configuration`](APIRef.Configuration.md).

### `device.openURL(url)`


### `device.sendUserNotification(params)`

### `device.setOrientation(orientation)`
Takes `"portrait"` or `"landscape"` and rotates the device to the given orientation.
Currently only available in the iOS Simulator.
