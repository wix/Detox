# The `device` Object

`device` is globally available in every test file, it enables control over the current attached device (currently only simulatoris supported).

- [`device.relaunchApp()`](#devicerelaunchapp)
- [`device.reloadReactNative()`](#devicereloadreactnative)
- [`device.installApp()`](#deviceinstallapp)
- [`device.uninstallApp()`](#deviceuninstallapp)
- [`device.openURL(url)`](#deviceopenurl)
- [`device.sendUserNotification(params)`](#devicesendusernotifications)
- [`device.shutdown()`](#deviceshutdown)

### `device.relaunchApp()`
Kill and relaunch the app defined in the current [`configuration`]().

### `device.reloadReactNative()`
If this is a react native app, reload react native JS bundle.

### `device.installApp()`
Install the app file defined in the current [`configuration`]().

### `device.uninstallApp()`
Uninstall the app defined in the current [`configuration`]().

### `device.openURL(url)`


### `device.sendUserNotification(params)`


### `device.shutdown()`
Shutdown the currently attached device.
