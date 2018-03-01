---
id: APIRef.Configuration
title: Configuration Options
---

## Configuring package.json 
### Device Configuration
`configurations` holds all the device configurations, if there is only one configuration in `configurations` `detox build` and `detox test` will default to it, to choose a specific configuration use `--configuration` param<br>
	

|Configuration Params|Details|
|---|---|
|`binaryPath`|relative path to the ipa/app due to be  tested (make sure you build the app in a project relative path)|
|`type`|device type, currently only `ios.simulator` is supported|
|`name`|device name, aligns to the device list avaliable through `xcrun simctl list` for example, this is one line of the output of `xcrun simctl list`: `A3C93900-6D17-4830-8FBE-E102E4BBCBB9  iPhone 7  Shutdown  iPhone 7  iOS 10.2`, ir order to choose the first `iPhone 7` regardless of OS version, use `iPhone 7`. <br>To be OS specific use `iPhone 7, iOS 10.2`|
|`build`| **[optional]** build command (either `xcodebuild`, `react-native run-ios`, etc...), will be later available through detox CLI tool.|
	
**Example:**

```json
  "detox": {
	...
    "configurations": {
      "ios.sim.debug": {
        "binaryPath": "ios/build/Build/Products/Debug-iphonesimulator/example.app",
        "build": "xcodebuild -project ios/example.xcodeproj -scheme example -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build",
        "type": "ios.simulator",
        "name": "iPhone 7 Plus"
      }
    }
  }
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

##### Optional: setting a test runner (Mocha as default, Jest is supported)
##### Mocha
```json
	"detox": {
	  ...
	  "test-runner": "mocha"
	  "runner-config": "path/to/mocha.opts"
	  "specs": "path/to/tests/root"
	}
```
`mocha.opts` refers to `--opts` in https://mochajs.org/#mochaopts

##### Jest
```json
	"detox": {
	  ...
	  "test-runner": "jest"
	  "runner-config": "path/to/config.json"
	}
```
`config.json` refers to `--config` in https://facebook.github.io/jest/docs/en/configuration.html
>NOTE: jest tests will run in band, as Detox does not currently supports parallelization. 

## detox-cli
### Build Configuration

In your detox config (in `package.json`) paste your build command into the configuration's `build` field. 
The build command will be triggered when running `detox build`.<br>
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
	detox test
	```
* For multiple configurations, choose your configuration by passing `--configuration` param:
	
	```sh
	detox test --configuration yourConfiguration
	```

### Faster test runs with app reuse
By default the app is removed, reinstalled and launched before each run.
Starting fresh is critical in CI but in dev you might be able to save time between test runs and reuse the app that was previously installed in the simulator. To do so use the `reuse` flag and run your tests like this:

```sh
detox test --reuse
```

This is especially useful with React Native DEV mode when making Javascript code changes that are getting picked up by the packager (and thus no reinstall is needed). This can save up to 7 seconds per run!
You should not use this option if you made native code changes or if your app relies on local ("disk") storage.
