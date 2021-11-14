## React Native Demo Project

### Environment

#### Fundamentals

**IMPORTANT:** Get your environment properly set up, as explained in our [contribution guide](../../docs/Guide.Contributing.md).

#### Execution Target

Be sure to set up either an iOS simulator or a proper Android AVD emulator matching the Detox configurations of the project (`devices` section of the `detox.config.js` file).

### Running this project in Release mode

#### Step 0: Prebuild

##### Android

Prebuild Detox as an Android archive (a `.aar` file), locally:

```sh
cd detox
npm run build:android
```

> On success, the result is a set of maven artifacts published in subdirectories under `detox/Detox-android/`. That includes `detox-999.999.999.aar` (i.e. Detox' native code packaged with the fake version `999.999.999`).

##### iOS

Install the necessary POD's:

```sh
cd detox
npm run podInstall:ios
```

#### Step 1: Build

Build the demo project using one of the npm-run scripts.

```sh
npm run build:ios-release
-or-
npm run build:android-release
```

#### Step 2: Execute Tests

```sh
npm run test:ios-release
-or-
npm run test:android-release
```

### Running this project in Debug mode

The project's tests can also be executed with the app running in debug mode (mainly, with Javascript code getting bundled on-the-fly using the `metro` server).

For that, first run the `metro` server:

```sh
npm start
```

then follow the same instructions specified for Release mode, above, using associated `debug` scripts instead of the `release` ones. Namely -

Build:

```sh
npm run build:ios-debug
-or-
npm run build:android-debug
```

Test:

```sh
npm run test:ios-debug
-or-
npm run test:android-debug
```
