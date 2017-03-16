# detox

Graybox E2E Tests and Automation Library for Mobile

[![NPM Version](https://img.shields.io/npm/v/detox.svg?style=flat)](https://www.npmjs.com/package/detox)
[![Build Status](https://travis-ci.org/wix/detox.svg?branch=master)](https://travis-ci.org/wix/detox)
[![NPM Downloads](https://img.shields.io/npm/dm/detox.svg?style=flat)](https://www.npmjs.com/package/detox)



- [About](#about)
- [Getting Started](#getting-started)
- [See it in Action](#see-it-in-action)
- [The Detox API](#the-detox-api)
- [Dealing with flakiness](#dealing-with-flakiness)
- [Contributing to detox](#contributing-to-detox)
- [Some implementation details](#some-implemetation-details)
- [License](#license)

<img src="http://i.imgur.com/3QqHeGO.gif">

## About

High velocity native mobile development requires us to adopt continuous integration workflows, which means our reliance on manual QA has to drop significantly. The most difficult part of automated testing on mobile is the tip of the testing pyramid - E2E. The core problem with E2E tests is flakiness - tests are usually not deterministic. We believe the only way to tackle flakiness head on is by moving from blackbox testing to graybox testing and that's where detox comes into play.

### Development still in progress!

Please note that this library is still pre version 1.0.0 and under active development. The NPM version is higher because the name "detox" was transferred to us from a previous inactive package.



## Getting Started

This is a step-by-step guide to help you add detox to your project.

If you used previous detox version, follow the [migration guide](MIGRATION.md).

#### Step 1: Installing Dependencies

* Install the latest version of [`brew`](http://brew.sh).
* If you haven't already, install Node.js
	
	 ```sh
	 brew update && brew install node 
	 ```

* You will also need `fbsimctl` installed: 

	 ```sh 
	 brew tap facebook/fb && brew install fbsimctl
	 ```
	 
* Detox CLI
 	
  `detox-cli` package should be installed globally, enabling usage of detox command line tools outside of your npm scripts.

  ```sh
  npm install -g detox-cli
  ```

* If you do not have a `package.json` file in the root folder of your project, create one by running 

  ```sh
  npm init
  ```
  Follow the on screen instructions.

##### Set Xcode build path
By default, Xcode uses a randomized hidden path for outputting project build artifacts, called DerivedData. For ease of use (and better support in CI environments), it is recommended to change the project build path to a more convenient path.

* With your project opened in Xcode, select menu `File` ► `Project Settings...`. Click on `Advanced...`, select `Custom` and from the drop-down menu, select `Project-relative Location`.
* Build artifacts will now be created in a `DerivedData` folder next to your `xcodeproj` project.

![Set relative path](project-relative-path.jpeg)

#### Step 2: Add Detox

* Install detox:

	```sh
	npm install detox --save-dev
	```

* Install mocha: 

	```sh
	npm install mocha --save-dev
	``` 

* Add the following to your `package.json`: <br>

	
	```json
	"detox": {
	  "configurations": {
	      "ios.sim.release": {
	        "binaryPath": "ios/build/Build/Products/Release-iphonesimulator/example.app",
	        "build": "xcodebuild -project ios/example.xcodeproj -scheme example -configuration Release -sdk iphonesimulator -derivedDataPath ios/build",
	        "type": "simulator",
	        "name": "iPhone 7"
	      }
	    } 
	  }
	```
For full configuration options see the **options** section below.
	

#### Step 3: Create your first test (using mocha test runner)

* Create an `e2e` folder in your project root.
* Create `mocha.opts` file with this [content](examples/demo-react-native/e2e/mocha.opts).
* Create `init.js` file with this [content](examples/demo-react-native/e2e/init.js).
* Create your first test! `myFirstTest.spec.js` with content similar to [this](examples/demo-react-native/e2e/example.spec.js).

#### Step 4: Build Your App and Run Detox Tests
By using the `detox` command line tool, you can build and test your project easily.

* Build your app:

	```sh
	detox build
	```

* Test your app:

	```sh
	detox test
	```

That's it!

## Options 

### Device Configuration
`configurations` holds all the device configurations, if there is only one configuration in `configurations` `detox build` and `detox test` will default to it, to choose a specific configuration use `--configuration` param<br>
	


	
Configuration Params|     Details     |
	--------------------|-----------------|
	`binaryPath`			| relative path to the ipa/app due to be  tested (make sure you build the app in a project relative path) |
	`type` 				| device type, currently on `simulator` (iOS) is supported |
	`name`					| device name, aligns to the device list avaliable through `fbsimctl list` for example, this is one line of the output of `fbsimctl list`: `A3C93900-6D17-4830-8FBE-E102E4BBCBB9 | iPhone 7 | Shutdown | iPhone 7 | iOS 10.2`, ir order to choose the first `iPhone 7` regardless of OS version, use `iPhone 7`. to be OS specific use `iPhone 7, iOS 10.2` |
	`build`				| **[optional]** build command (either `xcodebuild`, `react-native run-ios`, etc...), will be later available through detox CLI tool. |
	
	
###Server Configuration
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

### Test Root Folder


##### Optional: setting a custom test root folder
Applies when using `detox-cli` by running `detox test` command, default is `e2e`.
	
```json
	"detox": {
	  ...
	  "specs": "path/to/tests"
	}
```

### Build Configuration

In your detox config (in package.json) paste your build command into the configuration's `build` field. 
The build command will be triggered when running

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
	  
* If you have build problems, see [troubleshooting](#troubleshooting-build-problems).

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


## See it in Action

Open the [React Native demo project](examples/demo-react-native) and follow the instructions

Not using React Native? you now have a [pure native demo project](examples/demo-native-ios) too

## The Detox API
Check the [API Reference](API.md) or see detox's own [E2E test suite](detox/test/e2e) to learn the test API by example.

## Dealing With Flakiness

See the [Flakiness](FLAKINESS.md) handbook

## Contributing to Detox

If you're interested in working on detox core and contributing to detox itself, take a look [here](CONTRIBUTING.md).

## Some Implementation Details

* We let you write your e2e tests in JS (they can even be cross-platform)
* We use websockets to communicate (so it should be super fast and bi-directional)
* Both the app and the tester are clients, so we need the server to proxy between them
* We are relying on EarlGrey as our gray-box native library for iOS (espresso for Android later on)
* The JS tester controls EarlGrey by remote using a strange JSON protocol
* Instead of wrapping the zillion API calls EarlGrey supports, we implemented a reflection mechanism
* So the JS tester in low level actually invokes the native methods.. freaky
* We've abstracted this away in favor of a protractor-like api, see [`demo-react-native/e2e/example.spec.js`](examples/demo-react-native/e2e/example.spec.js)
* See everything EarlGrey supports [here](https://github.com/google/EarlGrey/blob/master/docs/api.md) and in this [cheatsheet](https://github.com/google/EarlGrey/blob/master/docs/cheatsheet/cheatsheet.pdf)
* We use [fbsimctl](https://github.com/facebook/FBSimulatorControl) to control the simulator from the test, restart the app, etc

## License

* detox by itself and all original source code in this repo is MIT
* detox relies on some important dependencies, their respective licenses are:
  * [EarlGrey](https://github.com/google/EarlGrey/blob/master/LICENSE)
  * [FBSimulatorControl](https://github.com/facebook/FBSimulatorControl/blob/master/LICENSE)

