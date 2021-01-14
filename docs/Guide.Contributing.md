# Contributing

## Prerequisites

### Install `node` v10.0 or Higher

```
brew install node
```

### Install Global Node.js Libraries `lerna` and `react-native-cli`

```sh
npm install -g lerna
npm install -g react-native-cli
```

For all the internal projects (detox, detox-cli, demos, test) `lerna` will create symbolic links in `node_modules` instead of `npm` copying the content of the projects. This way, any change you do on any code is there immediately. There is no need to update node modules or copy files between projects.

### Install `xcpretty`

```sh
gem install xcpretty
```

Alternatively, run `scripts/install.ios.sh` / `scripts/install.android.sh` to install all prerequisites.

## Detox

### Clone Detox and Submodules

```sh
git clone git@github.com:wix/detox.git
cd detox
git submodule update --init --recursive
```
(this makes sure all git submodule dependencies are properly checked out)

### Installing and Linking Internal Projects

```sh
lerna bootstrap
```

### Building and Testing

##### Automatically
`scripts/ci.ios.sh` and `scripts/ci.android.sh` are the scripts Detox runs in CI, they will run `lerna bootstrap`, unit tests, and E2E tests. Make sure these scripts pass before submitting a PR, this is exactly what Detox is going to run in CI. 

##### Manually
Alternatively, you can run it manually

#### 0. Fixing Compilation Issues in RN Sources

Detox Android test project uses React Native sources instead of the precompiled AAR. The test project uses RN51 and RN53, both have issues with compilation ([Fixed in RN55](https://github.com/facebook/react-native/commit/d8bb990abc226e778e2f32c2de3c6661c0aa64e5#diff-f44163238d434a443b56bd27b3ba0578)). In order to fix this issue, from inside `detox/test` run:
```sh
mv node_modules/react-native/ReactAndroid/release.gradle node_modules/react-native/ReactAndroid/release.gradle.bak
```

#### 1. Unit Tests

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

##### How to Read the Coverage Report

After running the tests, jest will create a coverage report.

```sh
cd detox
open coverage/lcov-report/index.html
```

#### 2. Running Detox e2e Coverage Tests

Detox has a suite of e2e tests to test its own API while developing (and for regression); We maintain a special application that is "tested" against Detox's API, but essentially, it's the API that is tested, not the app.

To run the e2e tests, you must first build the native code and then run based on your target of choice (Android / iOS):

##### iOS

```sh
cd detox/test
npm run build:ios
npm run e2e:ios
```

##### Android
```sh
cd detox/test
npm run build:android
npm run e2e:android
```

Android test project includes two flavors: 
`fromBin` - uses the precompiled aar from `node_modules` just like a standard RN project.
`fromSource` - compiles the project with RN sources from `node_modules`, this is useful when developing and debugging Espresso idle resource. 
[Here](https://facebook.github.io/react-native/docs/building-from-source.html#android) are the prerequisites to compiling React Native from source.

Each build can be triggered separately by running its assemble task:
`./gradlew assembleFromSourceDebug` or `./gradlew assembleFromBinDebug`.

To run from Android Studio, React native `react.gradle` script requires `node` to be in path.
on macOS environment variables can be exported to desktop applications by adding the following to your `.bashrc`/`.zshrc`:

```sh
launchctl setenv PATH $PATH
```

##### Changing the Detox e2e Test Suite

If you add, rename, or delete a test in `detox/test/e2e` suite, you should follow these steps:

1. In `detox/test` project, build the ios project with `npm run build:ios`.
2. Run all end-to-end tests on iOS with `npm run e2e:ios`.
3. In `detox/test` project, build the android project with `npm run build:android`
4. Run all end-to-end tests on Android with `npm run e2e:android`.

#### 3. Android Native Tests

0. Install Java and Android SDK 25
1. In `detox/android` run `./gradlew install` run

	```sh
	./gradlew test
	```

#### 4. Running Example Projects on Android

Before you build one of `example/demo-react-*` projects for Android, you need to publish `detox-999.999.999.aar` locally:

```bash
cd detox/android
./gradlew publish -Dversion=999.999.999 
```
