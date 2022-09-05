---
id: configuration
slug: api/configuration
title: Configuration Options
sidebar_label: Configuration Options
---

## Configuration Options

### Configuration File

In order for Detox to know what device & app to use (and a lot more, actually), it needs some configuration to be statically available in a configuration file. It supports both standalone configuration files, and a configuration bundling inside the project’s `package.json`.

In essence, Detox scans for the configuration to use, through multiple files. It starts from the current working directory, and runs over the following options, in this order:

1. `.detoxrc.js`
1. `.detoxrc.json`
1. `.detoxrc`
1. `detox.config.js`
1. `detox.config.json`
1. `package.json` (`"detox"` section)

Options 1-5 allow for a standalone Detox configuration in either a `json` format or using JavaScript syntax.
Option 6 means the configuration is available in `json` format inside the project’s `package.json`, which is more suitable if you like having all of your project’s configurations in one place.

Please find the [Detox example app](https://github.com/wix/Detox/blob/master/examples/demo-react-native/detox.config.js) as a working reference. Also, look at
[the typings file](https://github.com/wix/Detox/blob/master/detox/index.d.ts) provided by Detox.

#### Extending configurations

Since Detox [18.9.0](https://github.com/wix/Detox/releases/tag/18.9.0), you can also define base Detox configurations,
distribute them as `npm` modules for reuse across multiple projects, e.g.:

```js
{
  "extends": "@my-org/detox-preset",
  "runnerConfig": "e2e/jest.config.some-override.js"
}
```

Please note that `extends` has to be a valid Node module path. Relative module paths will be resolved relatively
to the Detox config file which contains that specific `extends` property, e.g.:

```js
// given: ~/Projects/my-project/.detoxrc.json
{ extends: "./e2e/detox-base-config" }
// goes to: ~/Projects/my-project/e2e/detox-base-config.js
{ extends: "./configs/base" }
// then goes to: ~/Projects/my-project/e2e/configs/base/index.js
// and so on...
```

#### Individual Configurations

> NOTE: The configuration format has been significantly updated since [18.3.1](https://github.com/wix/Detox/blob/18.3.1/docs/APIRef.Configuration.md) in a backward-compatible way.
> Click [here](https://github.com/wix/Detox/blob/18.3.1/docs/APIRef.Configuration.md) to the reference on the former configuration format.

`configurations` holds all the device/app-oriented configurations. To select a specific configuration when running Detox in command-line (i.e. `detox build`, `detox test`), use the `--configuration` argument.
Note: If there is only one configuration in `configurations`, Detox will default to it.

| Configuration Params | Details                                                                                                              |
| -------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `device`             | Device config (object) or an alias pointing to an already defined device in `"devices"` dictionary (see below).      |
| `app`                | App config (object) or an alias pointing to an already defined application in `"apps"` dictionary (see below).       |
| `apps`               | Same as the `app`, but that is an array form used for multi-app testing. Mutually exclusive with the `app` property. |
| `artifacts`          | Overrides to the artifacts config. See [Artifacts guide](#artifacts-configuration).                                  |
| `behavior`           | Overrides to the behavior config. See [Behavior guide](#behavior-configuration).                                     |
| `session`            | Overrides to the session config. See [Session guide](#server-configuration).                                         |
|                      |                                                                                                                      |
| `runnerConfig`       | Path to the test runner config. Default value: `e2e/config.json`.                                                    |
| `specs`              | A default glob pattern for a test runner to use when no test files are specified, e.g.: `e2e/**/*.test.js`           |

**Example:**

```js
{
  // ...
  "detox": {
    // ...
    "devices": {
      // ... see below ...
    },
    "apps": {
      // ... see below ...
    },
    "session": {
      // ... see below ...
    },
    "configurations": {
      "ios.sim.debug": {
        "device": "simulator",
        "app": "ios.debug"
      },
      "android.emu.release": {
        "device": "emulator",
        "app": "android.release"
      },
      "android.att.release": {
        "device": "android.attached",
        "app": "android.release"
      },
      "android.genymotion.release": {
        "device": "android.genycloud",
        "app": "android.release"
      }
    }
  }
}
```

#### Device configurations

The format of Detox config allows you to define inside it multiple device configs in a key-value manner, i.e.:

```js
{
  "devices": {
    "simulator": {
      "type": "ios.simulator",
      "device": {
        // one of these or a combination of them
        "id": "D53474CF-7DD1-4673-8517-E75DAD6C34D6",
        "type": "iPhone 11 Pro",
        "name": "MySim",
        "os": "iOS 13.0"
      }
    },
    "emulator": {
      "type": "android.emulator",
      "device": {
        "avdName": "Pixel_2_API_29"
      },
      "utilBinaryPaths": [
        "optional-property-with/path/to/test-butler-or-anything-else.apk"
      ]
    },
    "android.attached": {
      "type": "android.attached",
      "device": {
        "adbName": "YOGAA1BBB412"
      }
    },
    "android.genycloud": {
      "type": "android.genycloud",
      "device": {
        "recipeUUID": "11111111-2222-3333-4444-555555555555"
        // or recipeName: "MyRecipeName",
      }
    }
  },
  "apps": {
    // ... see below ...
  },
  "configurations": {
    // ... see above ...
  }
}
```

A device config can have the following params:

| Configuration Params | Details                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| -------------------- |-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `type`               | _**Required.** String Literal_. Mandatory property to discern device types: `ios.simulator`, `android.emulator`, `android.attached`, `android.genycloud` etc.                                                                                                                                                                                                                                                                                                                                       |
| `device`             | _**Required.** Object._ Device query, e.g. `{ "byType": "iPhone 11 Pro" }` for iOS simulator, `{ "avdName": "Pixel_2_API_29" }` for Android emulator or `{ "adbName": "<pattern>" }` for attached Android device with name matching the regex.                                                                                                                                                                                                                                                      |
| `bootArgs`           | _Optional. String. Supported by `ios.simulator` and `android.emulator` only._ <br/> Supply an extra _String_ of arguments to `xcrun simctl boot ...` or `emulator -verbose ... @AVD_Name`.                                                                                                                                                                                                                                                                                                          |
| `forceAdbInstall`    | _Optional. Boolean. Supported for Android devices only._ <br/> A _Boolean_ value, `false` by default. When set to `true`, it tells `device.installApp()` to use `adb install`. Otherwise, it would use the combination of `adb push <app.apk>` and `adb shell pm install`.                                                                                                                                                                                                                          |
| `utilBinaryPaths`    | _Optional. Array of strings. Supported for Android devices only._ <br/> An array of relative paths of _utility_ app (APK) binary-files to preinstall on the tested devices - once before the test execution begins.<br/>**Note**: these are not affected by various install-lifecycle events, such as launching an app with `device.launchApp({delete: true})`, which reinstalls the app. A good example of why this might come in handy is [Test Butler](https://github.com/linkedin/test-butler). |
| `gpuMode`            | _Optional. String Literal (<code>auto \                                                                                                                                                                                                                                                                                                                                                                                                                                                             | host \| swiftshader\_indirect \| angle\_indirect \| guest</code>). Supported by `android.emulator` only._ <br/> A fixed **string** , which tells [in which GPU mode](https://developer.android.com/studio/run/emulator-acceleration#command-gpu) the emulator should be booted.                                                                                                                                                                            |
| `headless`           | _Optional. Boolean._ `false` by default. When set to `true`, it tells Detox to boot an Android emulator with `-no-window` option, or to not open the iOS Simulator app when running with Android or iOS respectively.                                                                                                                                                                                                                                                                               |
| `readonly`           | _Optional. Boolean. Supported by `android.emulator` only._ <br/>  `false` by default. When set to `true`, it forces Detox to boot even a single emulator with `-read-only` option.<br/>**Note**: when used with multiple workers, this setting has no effect — emulators will be booted always with `-read-only`.                                                                                                                                                                                   |

Also, in the Detox `configurations` you can use the device configs as-is, without aliasing:

```js
{
  "configurations": {
    "ios.sim.debug": {
      "device": {
        "type": "ios.simulator",
        "device": {
          "type": "iPhone 12 Pro"
        }
      },
      "app": "alias-to-app"
      // ...
    }
  }
}
```

#### Apps configurations

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

| Configuration Params | Details                                                                                                                                                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`               | Mandatory property to discern app types: `ios.app`, `android.apk`.                                                                                                                                                  |
| `name`               | Use only when working with multiple apps within the same configuration. See an example below.                                                                                                                       |
| `binaryPath`         | Relative path to the ipa/app/apk due to be tested (make sure you build the app in a project relative path)                                                                                                          |
| `build`              | **\[optional]** Build command (normally an `xcodebuild` command you use to build your app), which can be called later using Detox CLI tool as a convenience.                                                        |
| `testBinaryPath`     | (optional, Android only): relative path to the test app (apk)                                                                                                                                                       |
| `launchArgs`         | **\[optional]** An object specifying arguments (key-values pairs) to pass through into the app, upon launching on the device. For more info, refer to the dedicated [launch-arguments guide](APIRef.LaunchArgs.md). |

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

After that, you can change the current app in your tests via [device API](APIRef.DeviceObjectAPI.md):

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

#### Artifacts Configuration

See more details in [artifacts doc](APIRef.Artifacts.md).

Detox can store artifacts such as transient screenshots and device logs.
You can control artifacts collection via Detox configuration:

```js
{
  "artifacts": {
    "rootDir": ".artifacts",
    "pathBuilder": "./config/pathbuilder.js",
    "plugins": {
      "instruments": {"enabled": false},
      "log": {"enabled": true},
      "uiHierarchy": "enabled",
      "screenshot": {
        "shouldTakeAutomaticSnapshots": true,
        "keepOnlyFailedTestsArtifacts": true,
        "takeWhen": {
          "testStart": false,
          "testDone": true
        }
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
      // ...
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

| preset  | object                                                       |
| ------- | ------------------------------------------------------------ |
| none    | `{ "enabled": false }`                                       |
| all     | `{ "enabled": true }`                                        |
| failing | `{ "enabled": true, "keepOnlyFailedTestsArtifacts": true }`  |
| manual  | `{ "enabled": true, "shouldTakeAutomaticSnapshots": false }` |

There is also a shortcut to disable artifacts for a specific configuration:

```js
{
  "configurations": {
    "ios.no-artifacts": {
      // ...
      "artifacts": false
    }
  }
}
```

#### Behavior Configuration

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

Also, you can override the behavior in specific Detox configurations:

```js
{
  "behavior": {
    // ... global behavior ...
  },
  "configurations": {
    "ios.manual": {
      "behavior": {
        // ... overrides ...
        "launchApp": "manual"
        // ... overrides ...
      }
    }
  }
}
```

#### Server Configuration

Detox can either initialize a server using a generated configuration, or can be overridden with a manual configuration:

```json
{
  "session": {
    "server": "ws://localhost:8099",
    "sessionId": "YourProjectSessionId"
  }
}
```

When you define a session config, the Detox server won’t start automatically anymore — it is assumed that
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
      // ...
      "session": {
        "server": "ws://localhost:8099",
        "sessionId": "YourProjectSessionId"
      }
    }
  }
}
```

Also, you can specify an optional numeric `debugSynchronization` parameter
(see also `--debug-synchronization` in [`detox-cli` test section](APIRef.DetoxCLI.md#test)).
When an action/expectation takes a significant amount time, use this option to print device synchronization status.
The status will be printed if the action takes more than _\[N]_ ms to complete.

```json
{
  "session": {
    "debugSynchronization": 20000
  }
}
```

To disable `debugSynchronization` explicitly, use `0`.

### `detox-cli`

#### Build Configuration

In your detox config (in `package.json`) paste your build command into the configuration’s `build` field.
The build command will be triggered when running `detox build`.
**This is only a convenience method, to help you manage building multiple configurations of your app and couple them to your tests. You can also choose not to use it and provide a compiled `app` by yourself.**

You can choose to build your project in any of these ways...

- If there’s only one configuration, you can simply use:

  ```sh
  detox build
  ```

- To choose a specific configuration:

  ```sh
  detox build --configuration yourConfiguration
  ```

- Building with `xcodebuild`:

  ```sh
  xcodebuild -project ios/YourProject.xcodeproj -scheme YourProject -sdk iphonesimulator -derivedDataPath ios/build
  ```

- Building using React Native, this is the least suggested way of running your build, since it also starts a random simulator and installs the app on it.

  ```sh
  react-native run-ios
  ```

> Note: remember to update the `app` path in your `package.json`.

#### Test Configuration

- If there’s only one configuration, you can simply use:

  ```sh
  detox test ./e2e
  ```

where `./e2e` is the path to your Detox tests folder.

- For multiple configurations, choose your configuration by passing `--configuration` param:

  ```sh
  detox test ./e2e --configuration yourConfiguration
  ```

#### Faster Test Runs with App Reuse

By default, the app is removed, reinstalled and launched before each run.
Starting fresh is critical in CI but during the development you might be able to save time between test runs and reuse the app that was previously installed in the simulator. To do so use the `reuse` flag and run your tests like this:

```sh
detox test ./e2e --reuse
```

This is especially useful with React Native development mode when making JavaScript code changes that are getting picked up by the packager (and thus no reinstall is needed). This can save up to 7 seconds per run!
You should not use this option if you made native code changes or if your app relies on local ("disk") storage.
