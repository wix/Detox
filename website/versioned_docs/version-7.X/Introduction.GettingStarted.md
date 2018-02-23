---
id: version-7.X-Introduction.GettingStarted
title: Getting Started
original_id: Introduction.GettingStarted
---

This is a step-by-step guide for adding Detox to your React Native project.

> TIP: You can also check out this [awesome tutorial](https://medium.com/@bogomolnyelad/how-to-test-your-react-native-app-like-a-real-user-ecfc72e9b6bc) on Medium with video by [@bogomolnyelad](https://medium.com/@bogomolnyelad)

<br>

## Prerequisites

Running Detox (on iOS) requires the following:

* Mac with macOS (at least macOS El Capitan 10.11)

* Xcode 8.3+ with Xcode command line tools
> TIP: Verify Xcode command line tools is installed by typing `gcc -v` in terminal (shows a popup if not installed)

* A working [React Native](https://facebook.github.io/react-native/docs/getting-started.html) app you want to test

<br>

## Step 1: Install dependencies

#### 1. Install the latest version of [Homebrew](http://brew.sh)

Homebrew is a package manager for macOS, we'll need it to install other command line tools.

> TIP: Verify it works by typing in terminal `brew -h` to output list of available commands

#### 2. Install [Node.js](https://nodejs.org/en/)

Node is the JavaScript runtime Detox will run on. **Install Node 7.6.0 or above for native async-await support**

 ```sh
 brew update && brew install node
 ```

> TIP: Verify it works by typing in terminal `node -v` to output current node version, should be higher than 7.6.0

#### 3. Install [appleSimUtils](https://github.com/wix/AppleSimulatorUtils)

A collection of utils for Apple simulators, Detox uses it communicate with the simulator.

```sh
brew tap wix/brew
brew install --HEAD applesimutils
```

> TIP: Verify it works by typing in terminal `applesimutils` to output the tool help screen

#### 4. Install Detox command line tools (detox-cli)

This package makes it easier to operate Detox from the command line. `detox-cli` should be installed globally, enabling usage of the command line tools outside of your npm scripts.

  ```sh
  npm install -g detox-cli
  ```
> TIP: Verify it works by typing in terminal `detox -h` to output the list of available commands

<br>

## Step 2: Add Detox to your project

#### 1. Install detox

Go to the root folder of your React Native app (where `package.json` is found):

```sh
npm install detox --save-dev
```

#### 2. Install mocha

You can use any JavaScript test runner
- [Jest](Guide.Jest.md)
- [Mocha](https://mochajs.org/) is a good one we recommend:

```sh
npm install mocha --save-dev
```

#### 3. Add Detox config to package.json

The basic configuration for Detox should be in your `package.json` file under the `detox` property:

```json
"detox": {
  "configurations": {
    "ios.sim.debug": {
      "binaryPath": "ios/build/Build/Products/Debug-iphonesimulator/example.app",
      "build": "xcodebuild -project ios/example.xcodeproj -scheme example -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build",
      "type": "ios.simulator",
      "name": "iPhone 7"
    }
  }
}
```

In the above configuration example, change `example` to your actual project name. Under the key `"binaryPath"`, `example.app` should be `<your_project_name>.app`. Under the key `"build"`, `example.xcodeproj` should be `<your_project_name>.xcodeproj` and `-scheme example` should be `-scheme <your_project_name>`.

For iOS apps in a workspace (eg: CocoaPods) use `-workspace ios/example.xcworkspace` instead of `-project`.

Also make sure the simulator model specified under the key `"name"` (`iPhone 7` above) is actually available on your machine (it was installed by Xcode). Check this by typing `xcrun simctl list` in terminal to display all available simulators.

> TIP: To test a release version, replace 'Debug' with 'Release' in the binaryPath and build properties. For full configuration options see Configuration under the API Reference.

<br>

## Step 3: Create your first test (using mocha test runner)

You can do this automatically by running:

```sh
detox init
```

Or you can do this manually instead by following these steps:

* Create an `e2e` folder in your project root
* Create `mocha.opts` file inside with this [content](/examples/demo-react-native/e2e/mocha.opts)
* Create `init.js` file inside with this [content](/examples/demo-react-native/e2e/init.js)
* Create your first test `firstTest.spec.js` inside with content similar to [this](/examples/demo-react-native/e2e/example.spec.js)

> TIP: Detox is not tightly coupled to Mocha or this directory structure, both are just a recommendation and are easy to replace without touching the internal implementation of Detox itself.

<br>

## Step 4: Build your app and run Detox tests

#### 1. Build your app

Use the Detox command line tools to build your project easily:

```sh
detox build
```

> TIP: Notice that the actual build command was specified in the Detox configuration above

#### 2. Run the tests (finally)

Use the Detox command line tools to test your project easily:

```sh
detox test
```

That's it. Your first failing Detox test is running!

Next, we'll go over usage and how to make this test [actually pass](Introduction.WritingFirstTest.md).
