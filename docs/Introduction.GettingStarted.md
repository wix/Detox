---
id: Introduction.GettingStarted
title: Getting Started
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

Node is the JavaScript runtime Detox will run on. **Install Node 8.3.0 or above**

 ```sh
 brew update && brew install node
 ```

> TIP: Verify it works by typing in terminal `node -v` to output current node version, should be 8.3.0 or higher

#### 3. Install [applesimutils](https://github.com/wix/AppleSimulatorUtils)

A collection of utils for Apple simulators, Detox uses it communicate with the simulator.

```sh
brew tap wix/brew
brew install applesimutils
```

> TIP: Verify it works by typing in terminal `applesimutils` to output the tool help screen

#### 4. Install Detox command line tools (detox-cli)

This package makes it easier to operate Detox from the command line. `detox-cli` should be installed globally, enabling usage of the command line tools outside of your npm scripts. `detox-cli` is merely a script that passes commands through to a the command line tool shipped inside `detox` package (in `node_modules/.bin/detox`).

  ```sh
  npm install -g detox-cli
  ```


## Step 2: Add Detox to your project

#### 1. Install detox

If you have a React Native project, go to its root folder (where `package.json` is found) and type the following command.

```sh
npm install detox --save-dev
```

If you have a project without Node integration (such as a native project), add the following package.json file to the root folder of you project:

```json
{
  "name": "<your_project_name>",
  "version": "0.0.1"
}
```

Now run the following command:

```sh
npm install detox --save-dev
```

> TIP: Remember to add the "node_modules" folder to your git ignore.

#### 2. Install a test runner

You can use any JavaScript test runner. Detox CLI supports Jest and Mocha out of the box.

- [Jest](http://jestjs.io/)

```sh
npm install jest --save-dev
```
Read the [Jest integration guide](Guide.Jest.md) for more details and gotchas.

- [Mocha](https://mochajs.org/)

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

## Step 3: Create your first test

Detox has `detox init` convenience method to automate a setup for your first test.  
At the moment, such scaffolding is supported for two test runners:

* ```detox init -r mocha```
* ```detox init -r jest```

In itself, `detox init` makes a few steps which you can reproduce manually:

* Create an `e2e` folder in your project root
* Inside `e2e` folder create `mocha.opts` (for `mocha`) or `config.json` (for `jest`). See examples: [mocha.opts](/examples/demo-react-native/e2e/mocha.opts), [config.json](/examples/demo-react-native-jest/e2e/config.json)
* Inside `e2e` folder create `init.js` file. See examples for [Mocha](/examples/demo-react-native/e2e/init.js) and [Jest](/examples/demo-react-native-jest/e2e/init.js).
* Inside `e2e` folder create `firstTest.spec.js` with content similar to [this](/examples/demo-react-native/e2e/example.spec.js).
* If you use `jest`, add `"test-runner": "jest"` to `detox` section in your `package.json` ([see example](https://github.com/wix/detox/blob/master/examples/demo-react-native-jest/package.json)).

> TIP: Detox is not tightly coupled to Mocha and Jest, neither to this specific directory structure. Both are just a recommendation and are easy to replace without touching the internal implementation of Detox itself.

<br>

## Step 4: Build your app and run Detox tests

#### 1. Build your app

Use a convenience method in Detox command line tools to build your project easily:

```sh
detox build
```

> TIP: Notice that the actual build command was specified in the Detox configuration in `package.json` .   
See `"build": "xcodebuild -project ..."` inside `ios.sim.debug` configuration (step 2.3).

#### 2. Run the tests (finally)

Use the Detox command line tools to test your project easily:

```sh
detox test
```

That's it. Your first failing Detox test is running!

Next, we'll go over usage and how to make this test [actually pass](Introduction.WritingFirstTest.md).
