# Configuration Options

## Configration file

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

Please find the [Detox example app](/examples/demo-react-native/detox.config.js) as a reference.

### Device Configuration

`configurations` holds all the device configurations, if there is only one configuration in `configurations` `detox build` and `detox test` will default to it, to choose a specific configuration use `--configuration` param

|Configuration Params|Details|
|---|---|
|`type`| Device type, available options are `ios.simulator`, `ios.none`, `android.emulator`, and `android.attached`. |
|`binaryPath`| Relative path to the ipa/app due to be  tested (make sure you build the app in a project relative path)|
|`testBinaryPath`| (optional, Android only): relative path to the test app (apk) |
|`device`| Device query, e.g. `{ "byType": "iPhone 11 Pro" }` for iOS simulator or `{ "avdName": "Pixel_2_API_29" }` |
|`build`| **[optional]** Build command (either `xcodebuild`, `react-native run-ios`, etc...), will be later available through detox CLI tool.|

**Example:**

```js
{
  // ...
  "detox": {
    // ...
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
    }
  }
}
```

### Artifacts Configuration

Detox can control artifacts collection via settings from `package.json`:

```js
{
  "detox": {
    "artifacts": {
      "rootDir": ".artifacts",
      "pathBuilder": "./config/pathbuilder.js",
      "plugins": {
        "instruments": { "enabled": false },
        "log": { "enabled": true },
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
        "launchApp": true,
        "exposeGlobals": true
      },
      "cleanup": {
        "shutdownDevice": false
      }
    }
  }
}
```

For example, if you want to launch your tested app manually, e.g. via `device.launchApp()`,
you should specify in `package.json`:

```json
{
  "detox": {
    "behavior": {
      "init": {
        "launchApp": false
      }
    }
  }
}
```

Setting `reinstallApp: false` will make the tests reuse the currently installed app on the device,
provided you have installed it beforehand.

If you do not wish to leak Detox globals (`expect`, `device`, `by`, etc.) to the global
scope, you can set `"exposeGlobals": false` and destructure them respectively from the
exported Detox interface:

```js
const { by, device, expect, element } = require('detox');
```

### Server Configuration

Detox can either initialize a server using a generated configuration, or can be overriden with a manual  configuration:

```json
  "detox": {
    ...
    "session": {
    "server": "ws://localhost:8099",
    "sessionId": "YourProjectSessionId"
    }
  }
```

Session can also be set per configuration:

```json
  "detox": {
  ...
    "configurations": {
      "ios.sim.debug": {
        ...
        "session": {
          "server": "ws://localhost:8099",
          "sessionId": "YourProjectSessionId"
        }
      }
    }
  }
```

### Test Runner Configuration

##### Jest (recommended)

```json
  "detox": {
    ...
    "test-runner": "jest"
    "runner-config": "path/to/jest-config"
  }
```

`path/to/jest-config` refers to `--config` in https://facebook.github.io/jest/docs/en/configuration.html

##### Mocha
```json
  "detox": {
    ...
    "test-runner": "mocha",
    "runner-config": "path/to/.mocharc.json"
  }
```

`.mocharc.json` refers to `--config` in https://mochajs.org/#-config-path

## detox-cli

### Build Configuration

In your detox config (in `package.json`) paste your build command into the configuration's `build` field.
The build command will be triggered when running `detox build`.
**This is only a convience method, to help you manage building multiple configurations of your app and couple them to your tests. You can also choose not to use it and provide a compiled `app` by yourself.**

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

### Faster test runs with app reuse

By default the app is removed, reinstalled and launched before each run.
Starting fresh is critical in CI but in dev you might be able to save time between test runs and reuse the app that was previously installed in the simulator. To do so use the `reuse` flag and run your tests like this:

```sh
detox test ./e2e --reuse
```

This is especially useful with React Native DEV mode when making Javascript code changes that are getting picked up by the packager (and thus no reinstall is needed). This can save up to 7 seconds per run!
You should not use this option if you made native code changes or if your app relies on local ("disk") storage.
