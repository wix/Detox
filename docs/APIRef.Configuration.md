# Configuration Options

## Configuration File

In order for Detox to know what device & app to use (and a lot more, actually), it needs some configuration to be statically available in a configuration file. It supports both standalone configuration files, and a configuration bundling inside the project's `package.json`.

In essence, Detox scans for the configuration to use, through multiple files. It starts from the current working directory, and runs over the following options, in this order:

1. `.detoxrc.js`
1. `.detoxrc.json`
1. `.detoxrc`
1. `detox.config.js`
1. `detox.config.json`
1. `package.json` (`"detox"` section)

Options 1-5 allow for a standalone Detox configuration in either a `json` format or using Javascript syntax.
Option 6 means the configuration is available in `json` format inside the project's `package.json`, which is more suitable if you like having all of your project's configurations in one place.

Please find the [Detox example app](/examples/demo-react-native/detox.config.js) as a working reference.

### Device Configuration

`configurations` holds all the device configurations, if there is only one configuration in `configurations` `detox build` and `detox test` will default to it, to choose a specific configuration use `--configuration` param

|Configuration Params|Details|
|---|---|
|`type`| Device type, available options are `ios.simulator`, `ios.none`, `android.emulator`, and `android.attached`. |
|`binaryPath`| Relative path to the ipa/app/apk due to be tested (make sure you build the app in a project relative path) |
|`testBinaryPath`| (optional, Android only): relative path to the test app (apk) |
|`utilBinaryPaths`| (optional, Android only): An **array** of relative paths of _utility_ app (apk) binary-files to preinstall on the tested devices - once before the test execution begins.<br />Note: these are not effected by various install-lifecycle events, such as launching an app with `device.launchApp({delete: true})`, which reinstalls the app. A good example of why this might come in handy is [Test Butler](https://github.com/linkedin/test-butler). |
|`device`| Device query, e.g. `{ "byType": "iPhone 11 Pro" }` for iOS simulator, `{ "avdName": "Pixel_2_API_29" }` for Android emulator or `{ "adbName": "<pattern>" }` for attached Android device with name matching the regex. |
|`build`| **[optional]** Build command (normally an `xcodebuild` command you use to build your app), which can be called later using Detox CLI tool as a convenience. |

**Example:**

```js
{
  // ...
  "detox": {
    // ...
    "session": {
      "debugSynchronization": 20000
    },
    "configurations": {
      "ios.sim.debug": {
        "binaryPath": "ios/build/Build/Products/Debug-iphonesimulator/example.app",
        "build": "xcodebuild -project ios/example.xcodeproj -scheme example -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build",
        "type": "ios.simulator",
        "device": { /* one of these or a combination of them */
          "id": "D53474CF-7DD1-4673-8517-E75DAD6C34D6",
          "type": "iPhone 11 Pro",
          "name": "MySim",
          "os": "iOS 13.0",
        }
      },
      "android.emu.release": {
        "binaryPath": "...",
        "build": "...",
        "type": "android.emulator",
        "device": {
          "avdName": "Pixel_2_API_29",
        }
      },
      "android.att.release": {
        "binaryPath": "...",
        "build": "...",
        "type": "android.attached",
        "device": {
          "adbName": "YOGAA1BBB412",
        }
      },
      "android.genymotion.release": {
        "binaryPath": "...",
        "build": "...",
        "type": "android.attached",
        "device": {
          "adbName": "^((1?\\d?\\d|25[0-5]|2[0-4]\\d)(\\.|:)){4}[0-9]{4}",
        }
      },
    }
  }
}
```

### Artifacts Configuration

Detox can store artifacts such as transient screenshots and device logs. You can control artifacts collection via Detox configuration:

```js
{
  "artifacts": {
    "rootDir": ".artifacts",
    "pathBuilder": "./config/pathbuilder.js",
    "plugins": {
      "instruments": { "enabled": false },
      "log": { "enabled": true },
      "uiHierarchy": "enabled",
      "screenshot": {
        "shouldTakeAutomaticSnapshots": true,
        "keepOnlyFailedTestsArtifacts": true,
        "takeWhen": {
          "testStart": false,
          "testDone": true,
        },
      },
      "video": {
        "android": {
          "bitRate": 4000000
        },
        "simulator": {
          "codec": "hevc"
        }
      }
    }
  },
  "configurations": {
    "ios.sim.release": {
      "binaryPath": "/path/to/app",
      "device": { /* ... */ },
      "artifacts": {
        "rootDir": ".artifacts/ios",
        "plugins": {
          "instruments": "all"
        }
      }
    }
  }
}
```

As can be seen from the example above, in a specific configuration you may override individual properties from the default artifacts
configuration. For instance, in the example above you can see that specifically in `ios.sim.release` we turn on `instruments` plugin.

CLI arguments (e.g., `--artifacts-location`, `--record-logs`) still have the highest priority and override their counterparts from JSON.

Also, that example demonstrates that you can use strings (identical to the ones from CLI) in parallel to the object configurations for plugins.
Below you can see mappings between the string presets and the corresponding objects:

| preset  |  object                                                      |
|---------|--------------------------------------------------------------|
| none    | `{ "enabled": false }                                      ` |
| all     | `{ "enabled": true }                                       ` |
| failing | `{ "enabled": true, "keepOnlyFailedTestsArtifacts": true } ` |
| manual  | `{ "enabled": true, "shouldTakeAutomaticSnapshots": false }` |

### Behavior Configuration

If you need to tweak the flow of `detox.init()` or `detox.cleanup()` steps,
you have a few options to change. These are the default behavior values:

```json
{
  "detox": {
    "behavior": {
      "init": {
        "reinstallApp": true,
        "exposeGlobals": true
      },
      "launchApp": "auto",
      "cleanup": {
        "shutdownDevice": false
      }
    }
  }
}
```

The `launchApp: "auto"` setting can be changed to `"manual"` for cases when you want to debug the
native codebase when running Detox tests. Usually **you never need that**, but if you do, follow the
[Debugging Apps in Android Studio During a Test](Guide.DebuggingInAndroidStudio.md) guide to learn
more about this. When set to `manual`, it changes the default value of `reinstallApp` to `false`.

Setting `reinstallApp: false` will make the tests reuse the currently installed app on the device,
provided you have installed it beforehand explicitly or manually.

If you do not wish to leak Detox globals (`expect`, `device`, `by`, etc.) to the global
scope, you can set `"exposeGlobals": false` and destructure them respectively from the
exported Detox interface:

```js
const { by, device, expect, element } = require('detox');
```

### Server Configuration

Detox can either initialize a server using a generated configuration, or can be overriden with a manual configuration:

```json
{
  "session": {
    "server": "ws://localhost:8099",
    "sessionId": "YourProjectSessionId"
  }
```

When you define a session config, the Detox server won't start automatically anymore — it is assumed that
you will be running it independently via `detox run-server` CLI command. Alternatively, you can set the
`autoStart` property to be explicitly `true`:

```diff
   "session": {
+    "autoStart": true,
     "server": "ws://localhost:8099",
     "sessionId": "YourProjectSessionId"
```

Defining an explicit session config with `server` and `sessionId` also means you cannot use multiple workers,
since the specified port will become busy for any test worker next to the first one to occupy it.

Session can be set also per device configuration — then it takes a higher priority over the global
session config:

```json
{  
  "configurations": {
    "ios.sim.debug": {
      ...
      "session": {
        "server": "ws://localhost:8099",
        "sessionId": "YourProjectSessionId",
      }
    }
  }
}
```

Also, you can specify an optional numeric `debugSynchronization` parameter
(see also `--debug-synchronization` in [APIRef.DetoxCLI.md#test](APIRef.DetoxCLI.md#test)).
When an action/expectation takes a significant amount time, use this option to print device synchronization status.
The status will be printed if the action takes more than _[N]_ ms to complete.

```json
{
    "session": {
      "debugSynchronization": 20000
    }
}
```

To disable `debugSynchronization` explicitly, use `0`.

## `detox-cli`

### Build Configuration

In your detox config (in `package.json`) paste your build command into the configuration's `build` field.
The build command will be triggered when running `detox build`.
**This is only a convenience method, to help you manage building multiple configurations of your app and couple them to your tests. You can also choose not to use it and provide a compiled `app` by yourself.**

You can choose to build your project in any of these ways...

* If there's only one configuration, you can simply use:

  ```sh
  detox build
  ```

* To choose a specific configuration:

  ```sh
  detox build --configuration yourConfiguration
  ```

* Building with xcodebuild:

  ```sh
  xcodebuild -project ios/YourProject.xcodeproj -scheme YourProject -sdk iphonesimulator -derivedDataPath ios/build
  ```

* Building using React Native, this is the least suggested way of running your build, since it also starts a random simulator and installs the app on it.

  ```sh
  react-native run-ios
  ```

> Note: remember to update the `app` path in your `package.json`.


### Test Configuration

* If there's only one configuration, you can simply use:

  ```sh
  detox test ./e2e
  ```

where `./e2e` is the path to your Detox tests folder.

* For multiple configurations, choose your configuration by passing `--configuration` param:

  ```sh
  detox test ./e2e --configuration yourConfiguration
  ```

### Faster Test Runs with App Reuse

By default the app is removed, reinstalled and launched before each run.
Starting fresh is critical in CI but in dev you might be able to save time between test runs and reuse the app that was previously installed in the simulator. To do so use the `reuse` flag and run your tests like this:

```sh
detox test ./e2e --reuse
```

This is especially useful with React Native dev mode when making Javascript code changes that are getting picked up by the packager (and thus no reinstall is needed). This can save up to 7 seconds per run!
You should not use this option if you made native code changes or if your app relies on local ("disk") storage.
