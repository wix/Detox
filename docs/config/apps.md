# Apps

The format of Detox config allows you to define inside it multiple app configs in a key-value manner, i.e.:

```js
{
  "devices": {
    // ... see above ...
  },
  "apps": {
    "ios.debug": {
      "type": "ios.app",
      "binaryPath": "ios/build/Build/Products/Debug-iphonesimulator/example.app",
      "build": "xcodebuild -project ios/example.xcodeproj -scheme example -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build"
    },
    "android.release": {
      "type": "android.apk",
      "binaryPath": "path/to/myApp.apk",
      "build": "..."
    }
  },
  "configurations": {
    // ... see above ...
  }
}
```

An app config can have the following params:

| Configuration Params | Details                                                                                                                                                                                                               |
| -------------------- |-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `type`               | Mandatory property to discern app types: `ios.app`, `android.apk`.                                                                                                                                                    |
| `name`               | Use only when working with multiple apps within the same configuration. See an example below.                                                                                                                         |
| `binaryPath`         | Relative path to the ipa/app/apk due to be tested (make sure you build the app in a project relative path)                                                                                                            |
| `build`              | **\[optional]** Build command (normally an `xcodebuild` command you use to build your app), which can be called later using Detox CLI tool as a convenience.                                                          |
| `testBinaryPath`     | (optional, Android only): relative path to the test app (apk)                                                                                                                                                         |
| `launchArgs`         | **\[optional]** An object specifying arguments (key-values pairs) to pass through into the app, upon launching on the device. For more info, refer to the dedicated [launch-arguments guide](../Guide.LaunchArgs.md). |

To work with multiple apps within the same configuration you should be giving each app its name, e.g.:

```js
{
  "apps": {
    "driver.ios.release": {
      "type": "ios.app",
      "name": "driver",
      "binaryPath": "path/to/driver.app"
    },
    "passenger.ios.release": {
      "type": "ios.app",
      "name": "passenger",
      "binaryPath": "path/to/passenger.app"
    }
  },
  "configurations": {
    "ios.release": {
      "device": "simulator",
      "apps": ["driver", "passenger"]
    }
  }
}
```

After that, you can change the current app in your tests via [device API](api/device.md):

```js
await device.selectApp('driver');
await device.launchApp();
// ... run tests ...
await device.selectApp('passenger');
await device.launchApp();
// ... run tests ...
```

Similar to device configs, any app config can be inlined as well:

```js
{
  "configurations": {
    "ios.sim.debug": {
      "device": "simulator",
      "app": {
        "type": "ios.app",
        "binaryPath": "ios/build/Build/Products/Debug-iphonesimulator/example.app",
        "build": "xcodebuild -project ios/example.xcodeproj -scheme example -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build"
      }
    }
  }
}
```
