---
id: contributing
slug: contributing
title: Contributing
sidebar_label: Contributing
---

## Contributing

This guide is about contributing to our codebase.

We don’t have any special guidelines - just some setup walk-through!

### Environment

#### Install Homebrew

If you haven’t yet - install [`brew`](https://brew.sh/).

#### Install Node.js v12.x or newer

There’s more than one way to install Node.js:

- Download from the [official download page](https://nodejs.org/en/download/)
- Use [Homebrew](https://formulae.brew.sh/formula/node)
- Use `nvm` - if you need to allow for several versions to be installed on a single machine

The best way is to use `nvm`, but the simplest way is to use Homebrew:

```sh
brew install node
```

#### Install `npm`

Either install `npm` or check that you have it installed, using their [official guide](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm).

> **NOTE: For Detox, please use the latest `npm` version `6.x.x` (i.e not version 7.0.0 or newer).**

#### Install the monorepo management tool, `lerna`

```sh
npm install -g lerna@3.x.x
```

For all the internal projects (detox, detox-cli, demos, test) `lerna` will create symbolic links in `node_modules` instead of `npm` copying the content of the projects. This way, any change you do on any code is there immediately. There is no need to update node modules or copy files between projects.

#### Install common React Native dependencies

React-Native CLI:

```sh
npm install -g react-native-cli
```

Watchman:

```sh
brew install watchman
```

#### iOS

For iOS, you must install Xcode and related tools. Refer to our [Setting Up an iOS Environment](Introduction.iOSDevEnv.md) guide.

You must also have `xcpretty` installed:

```sh
gem install xcpretty
```

#### Android

For Android, you need to have Java and the Android SDK properly set up. Refer to our [Setting Up an Android Development & Testing Environment](Introduction.AndroidDevEnv.md) guide.

### Detox

#### Clone Detox and Submodules

```sh
git clone git@github.com:wix/detox.git
cd detox
git submodule update --init --recursive
```

(this makes sure all git submodule dependencies have been properly checked out)

#### Installing and Linking Internal Projects

```sh
lerna bootstrap
```

#### Building and Testing

##### Automatically

`scripts/ci.ios.sh` and `scripts/ci.android.sh` are the scripts Detox runs in CI, they will run `lerna bootstrap`, unit tests, and E2E tests. Make sure these scripts pass before submitting a PR, this is exactly what Detox is going to run in CI.

##### Manually

The following steps can be run manually in order to build / test the various components of Detox.

###### 0. (React Native ≤ 0.55.x) Fixing Compilation Issues in RN Sources

Detox Android test project uses React Native sources instead of the precompiled AAR. The test project uses React Native 0.51 and 0.53, both have issues with compilation ([fixed in 0.55](https://github.com/facebook/react-native/commit/d8bb990abc226e778e2f32c2de3c6661c0aa64e5#diff-f44163238d434a443b56bd27b3ba0578)). In order to fix this issue, from inside `detox/test` run:

```sh
mv node_modules/react-native/ReactAndroid/release.gradle node_modules/react-native/ReactAndroid/release.gradle.bak
```

###### 1. Unit Tests and Lint

```sh
lerna run test
```

Detox JS code is 100% test covered and is set to break the build if coverage gets below, so make sure you run unit tests (`lerna run test`) locally before pushing.

Alternatively, to run only the JS tests, run the following from the `detox/detox` directory:

```sh
npm run unit
-or-
npm run unit:watch
```

After running the tests, _Jest_ will create a coverage report you can examine:

```sh
cd detox
open coverage/lcov-report/index.html
```

###### 2. Running Detox E2E Coverage Tests

Detox has a suite of end-to-end tests to test its own API while developing (and for regression); We maintain a special application that is "tested" against Detox’s API, but essentially, it’s the API that is tested, not the app.

To run the tests, you must first build the native code and then run based on your target of choice (Android / iOS):

- **iOS:**

  ```sh
  cd detox/test
  npm run build:ios
  npm run e2e:ios
  ```

- **Android:**

  ```sh
  cd detox/test
  npm run build:android
  npm run e2e:android
  ```

FYI Android test project includes two flavors:

- `fromBin` - (**standard use case**) utilizes the precompiled `.aar` from `node_modules` just like a standard RN project.
- `fromSource` - compiles the project with RN sources from `node_modules`, this is useful when developing and debugging Espresso idle resource.
  [Here](https://github.com/facebook/react-native/wiki/Building-from-source#android) are the prerequisites to compiling React Native from source.

Each build can be triggered separately by running its Gradle assembling task (under `detox/test/android/`):

```sh
./gradlew assembleFromSourceDebug
-or-
./gradlew assembleFromBinDebug
```

To run from Android Studio, React Native’s `react.gradle` script may require `node` to be in path.
On MacOS, environment variables can be exported to desktop applications by adding the following to your `.bashrc`/`.zshrc`:

```sh
launchctl setenv PATH $PATH
```

###### 3. Android Native Unit-Tests

Under `detox/android`:

```sh
./gradlew testFullRelease
```

### Detox - Example Projects

This is in fact a monorepo that also sports some example projects (for usage reference), alongside the main test project:

- `examples/demo-react-native-jest`: Demonstrate usage of Detox in a React Native app project.
- `examples/demo-native-ios`: Demonstrates usage of Detox in a pure-native iOS app.
- `examples/demo-native-android` (broken): Demonstrates usage of Detox in a pure-native Android app.
- `examples/demo-pure-native-android`: Demonstrates usage of the _pure_ [Detox-Native](https://github.com/wix/Detox/tree/master/detox-native/README.md) project
- more...

**In order to run E2E tests associated with any of these projects, refer to the [project-specific](https://github.com/wix/Detox/tree/master/examples) READMEs.**
