# The `device` Object

`device` is globally available in every test file, it enables control over the current attached device (currently only simulators are supported).

### Methods

- [`device.relaunchApp()`](#devicerelaunchapp)
- [`device.reloadReactNative()`](#devicereloadreactnative)
- [`device.installApp()`](#deviceinstallapp)
- [`device.uninstallApp()`](#deviceuninstallapp)
- [`device.openURL(url)`](#deviceopenurl)
- [`device.sendUserNotification(params)`](#devicesendusernotifications)
- [`device.setLocation(lat, lon)`](#devicesetlocation)

### `device.relaunchApp(params)`
Kill and relaunch the app defined in the current [`configuration`](APIRef.Configuration.md).

**Options:** 

##### 1. Set runtime permissions
Grant or deny runtime permissions for your application. 

```js
await device.relaunchApp({permissions: {calendar: 'YES'}});
```
Detox uses [AppleSimUtils](https://github.com/wix/AppleSimulatorUtils) on iOS to support this functionality. Read about the different types of permissions and how to set them in AppleSimUtils' Readme.


##### 2. Launch from URL
Mock opening the app from URL to test your app's deep link handling mechanism.

```js
await device.relaunchApp({url: url});
```
Read more in [Mocking Open From URL](APIRef.MockingOpenFromURL.md) section.

##### 3. Launch from user notifications

```js
await device.relaunchApp({userNotification: notification});
```
Read more in [Mocking User Notifications](APIRef.MockingUserNotifications.md) section.

##### 4. Launch into a fresh installation 
A flag that enables relaunching into a fresh installation of the app (it will uninstall and install the binary again), default is `false`.

```js
await device.relaunchApp({delete: true});
```

### `device.reloadReactNative()`
If this is a react native app, reload react native JS bundle. This action is much faster than `device.relaunchApp()`, and is recommended if you just need to reset your react native logic.

### `device.installApp()`
Install the app file defined in the current [`configuration`](APIRef.Configuration.md).

### `device.uninstallApp()`
Uninstall the app defined in the current [`configuration`](APIRef.Configuration.md).

### `device.openURL({url, sourceApp})`
Open the url. `sourceApp` is an optional parameter to specify source application bundle id


### `device.sendUserNotification(params)`

### `device.setOrientation(orientation)`
Takes `"portrait"` or `"landscape"` and rotates the device to the given orientation.
Currently only available in the iOS Simulator.

### `device.setLocation(lat, lon)`
Sets the simulator location to the given latitude and longitude.
