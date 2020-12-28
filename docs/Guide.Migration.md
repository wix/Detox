# Migration Guide

We are improving Detox API as we go along, sometimes these changes require us to break the API in order for it to make more sense. These migration guides refer to breaking changes. If a newer version has no entries in this document, it means it does not require special migration steps. Refer to the release notes of the later builds to learn about their improvements and changes.

## 18.0

Detox now uses a custom synchronization system on iOS, [developed in-house](https://github.com/wix/DetoxSync); this is the second step in phasing out our Earl Grey usage. We have tested this system extensively internally, and are confident that it should work as expected. There are no known limitations with the new system.

If you are seeing issues with the new sync system, please open an issue.

**Breaking:**

* **iOS.** Detox now requires iOS 13.0 and above iOS simulator runtimers, and iOS 12.x and below are no longer supported. This does not require that you drop support for iOS 12.x in your apps, just that tests will no longer work on iOS 12 and below. Please make sure your tests are running on iOS 13 or above
* **JS.** `detox.init()` will not launch the app anymore (even if asked to do so in configuration). Launching the app explicitly with `device.launchApp()` is now mandatory.
* **JS (jest-circus).** The `DetoxCircusEnvironment` provided from `detox/runners/jest-circus` package now requires two arguments in its constructor, so you have to update your descendant class signature:
```diff
class CustomDetoxEnvironment extends DetoxCircusEnvironment {
-  constructor(config) {
-    super(config);
+  constructor(config, context) {
+    super(config, context);
```
* **JS (iOS).** `device.launchApp({ launchArgs: { ... })` argument escaping has been improved. If you use complex launch args such as regular expressions, make sure you remove manual escaping from now on to avoid erroneous double escaping, e.g.:
```diff
 await device.launchApp({
   launchArgs: {
-    detoxURLBlacklistRegex: '(\\".*example.com/some-url/.*\\")' }`,
+    detoxURLBlacklistRegex: '(".*example.com/some-url/.*")' }`,
   },
 });
```
* **JS (internal).** There is a breaking change for people writing custom Detox integrations. Environment variable naming schema has changed – now Detox uses prefix to distinguish its own environment variables (usually passed from `detox test` CLI), e.g.: `recordLogs=all` becomes `DETOX_RECORD_LOGS=all`, `loglevel=trace` becomes `DETOX_LOGLEVEL=trace`, and so on.

## 17.5.2

Fixes the issue from **17.4.7** (see below) - now the migration guide for **17.4.7** can be safely ignored.

## 17.4.7

This release was not meant to be breaking in any sense, but unfortunately there are two minor caveats that leaked in.

### jest-cli

From now on, Detox explicitly depends on `jest-cli` package (marked as a peerDependency), that's why if you see an error like the one below:

```
Cannot find module 'jest-cli/build/cli/args'
```

~You should add `jest-cli` to your `package.json`'s `devDependencies` and rerun `npm install`, e.g.:~

**UPD**: since `detox@17.5.2` you can ignore this advice. The problem should go away **without** these edits:

```diff
 "devDependencies": {
   "jest": "26.x.x",
+  "jest-cli": "26.x.x",
```

### detox-cli

If you were using `detox-cli` global package, make sure to upgrade it before proceeding to `detox@17.4.7`.

```
npm -g install detox-cli
```

If you have an older version of `detox-cli`, then you might see the following error on an attempt to run  `detox test <...args>`:

```
'jest' is not recognized as an internal or external command,
operable program or batch file.
detox[43764] ERROR: [cli.js] Error: Command failed: jest --config e2e/config.json --testNamePattern "^((?!:android:).)*$" --maxWorkers 1 e2e
```

## 17.3.0

In the context of introducting the element screenshots feature ([#2012](https://github.com/wix/Detox/issues/2012)), we decided to slightly change the contract between Detox and externally-implemented _drivers_. These should be modified according to the follow diff-snippet:

```diff
class Expect {
-  constructor(invocationManager) {
+  constructor({ invocationManager }) {
     this._invocationManager = invocationManager;
  }
}

class PluginDriver {
  constructor() {
-    this.matchers = new Expect(new invocationManager());
  }
}

-module.exports = PluginDriver;
+module.exports = {
+  DriverClass: PluginDriver,
+  ExpectClass: Expect,
+}
```

## 17.0.0

Detox for iOS now uses an entirely new, custom built matcher, action and expectation infrastructure. This is the first step in our roadmap of removing Earl Grey as a dependency.

While the new system has been designed to be as compatible as possible with the existing system, some changes we made to existing APIs that may or may not require your attention.

##### New API

- `pinch()`—new API for pinching elements, replacing the deprecated `pinchWithAngle()` (iOS) 
- `getAttributes()`—new API for obtaining element properties (iOS)
- `not`—new API for inverting expectation logic (iOS, Android)

##### Modified API (**Potentially Breaking Changes**)

The following APIs have changed and require attention

- `by.text()`—matching elements by text actually uses the element's text value instead of using the accessibility label (iOS)
- `by.traits()`—the supported trait values have changed (iOS)
- `atIndex()`—matched elements are now sorted by x and y axes to allow for stability between tests; indices will most likely change after upgrading to this version of Detox (iOS)
- `tap()`—this method now accepts an optional point to tap (iOS, Android)
- `setColumnToValue()`—this method no longer supports date pickers; use `setDatePickerDate()` to change picker dates (iOS)
- `setDatePickerDate()`—in addition to normal date formats, a new special case is introduced for ISO 8601 formatted date strings: `"ISO8601"` (iOS)

##### Deprecated API

The following APIs have been deprecated, but is still available

- `tapAtPoint()`—the API has been consolidated with `tap(point)` (iOS, Android)
- `pinchWithAngle()`—this API has been replaced with `pinch()` (iOS)
- `toBeNotVisible()`—deprecated in favor of `not.toBeVisible()` (iOS, Android)
- `toNotExist()`—deprecated in favor of `not.toExist()` (iOS, Android)

Make sure to read the API reference for [matchers](https://github.com/wix/Detox/blob/master/docs/APIRef.Matchers.md), [actions](https://github.com/wix/Detox/blob/master/docs/APIRef.ActionsOnElement.md) and [expectations](https://github.com/wix/Detox/blob/master/docs/APIRef.Expect.md).

If you see unexpected results, make sure to open an issue.

## 16.0.0

Detox now comes as a prebuilt framework on iOS, thus lowering npm install times and saving some build issues that happen due to unexpected Xcode setups.

To support this, Detox needs Swift 5 support, so the iOS requirements have changed slightly:
* **Xcode**: 10.2 or higher
  * **iOS Simulator Runtime**: iOS 12.2 or higher

This does not require that your app require iOS 12.2, only that you build and run your app on Xcode 10.2 or above, and use an iOS 12.2 or above simulator.

## 14.5.0

It is recommended to change "name" string to "device" object in your configurations, like shown below:

Before:
```json
{
  "ios.sim.debug": {
    "type": "ios.simulator",
    "name": "iPhone 11 Pro"
  },
  "android.emu.release": {
    "type": "android.emulator",
    "name": "Nexus_5X_API_29"
  },
  "android.att.release": {
    "type": "android.attached",
    "name": "YOGAA1BBB412"
  }
}
```

After:

```js
{
  "ios.sim.debug": {
    "type": "ios.simulator",
    "device": { // one of these or a combination of them
      "id": "D53474CF-7DD1-4673-8517-E75DAD6C34D6",
      "type": "iPhone 11 Pro",
      "name": "MySim",
      "os": "iOS 13.0",
    }
  },
  "android.emu.release": {
    "type": "android.emulator",
    "device": { // only avdName is supported at the moment
      "avdName": "Nexus_5X_API_29",
    }
  },
  "android.att.release": {
    "type": "android.attached",
    "device": { // only adbName is supported at the moment
      "adbName": "YOGAA1BBB412",
    }
  }
}
```

## 14.0.0

Detox 14.0.0 drops support for iOS 9.x simulators, and thus it also drops support for any API that is deprecated in iOS 10 and above. This includes legacy [remote](https://developer.apple.com/documentation/uikit/uiapplicationdelegate/1623013-application?language=objc) and [local](https://developer.apple.com/documentation/uikit/uiapplicationdelegate/1622930-application?language=objc) notifications handling API. These APIs have been deprecated since iOS 10, and we believe we've given app developers enough time to use the modern APIs. Make sure you transition to the [UserNotifications framework](https://developer.apple.com/documentation/usernotifications?language=objc) as soon as possible.

**Please note that for React Native apps, [PushNotificationIOS (`RCTPushNotificationManager`)](https://facebook.github.io/react-native/docs/pushnotificationios) is severely outdated and does not support these modern APIs.** It is recommended to transition to a more modern solution. While it is sad that such an important app feature is let to stagnate so much by Facebook, it cannot be the concern of Detox. It is up to RN users to keep their apps up to date with the latest Apple APIs.

Our [own React Native notifications solution](https://github.com/wix/react-native-notifications) supports these modern APIs.

See [#1514](https://github.com/wix/Detox/issues/1514).

## Migrating to 12.7.0 from older (nonbreaking)

**This is only relevant to those running Detox using [`Jest` as the test runner](APIRef.Configuration.md#test-runner-configuration)**!

In `12.7.0` we've greatly improved our support in Jest - trying to tackle these two caveats which hold developers back from embracing it:

1. Jest file-level summary logs take precedence over 'plain' output, which makes them and all other logs (e.g. user in-test logging) seem cluttered.
2. Plain logs output is batched, and thus often does not show in real-time as the test is run. This is particularly annoying when running tests on the local computer.
3. Jest offeres no spec-level logging => no way to tell what's running "right now" and which test created what log-outputs.

_Put in simple words, Jest is optimized for running tests concurrently using multiple workers. This isn't the case when writing/debugging tests on a local machine._

In `12.7.0` we've worked out a configuration scheme that aims at solving these by streamlining all test-related outputs. **Please follow the updated [Jest installation guide](Guide.Jest.md), to set it up.**

## Migrating from Detox 12.4.x to 12.5.0 (nonbreaking)

Starting Detox `12.5.0`, we ship Android with precompiled sources under a  `.aar` file. The complete configuration process is thoroughly described in the [Android setup guide](Introduction.Android.md#2-add-detox-dependency-to-an-android-project) - but it mostly fits **new** projects. For existing projects, migrating is strongly recommended; Here's the diff:

Root `settings.gradle` file:

```diff
-include ':detox'
-project(':detox').projectDir = new File(rootProject.projectDir, '../node_modules/detox/android/detox')
```



Root buildscript (i.e. `build.gradle`):

```diff
allprojects {
    repositories {
         // ...
+        maven {
+            url "$rootDir/../node_modules/detox/Detox-android"
+        }
     }
 }
```



App buildscript (i.e. `app/build.gradle`):

```diff
 dependencies {
-    androidTestImplementation(project(path: ":detox"))
+    androidTestImplementation('com.wix:detox:+') { transitive = true }
 }
```



#### Proguard Configuration

If you have Detox Proguard rules integrated into the `app/build.gradle`, be sure to switch to an explicit search path:

```diff
     buildTypes {
         release {
         
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
-            proguardFile "${project(':detox').projectDir}/proguard-rules-app.pro"
+            proguardFile "${rootProject.projectDir}/../node_modules/detox/android/detox/proguard-rules-app.pro"

         }
     }
```



## Migrating from Detox 12.3.x to 12.4.0

The deprecation of `"specs"` (in `package.json`) introduced in 12.1.0 is **no longer relevant**.
It is valid now, like it was before, but from now on the semantics has been slightly changed -
it acts as a fallback for the default root for your Detox e2e specs, in cases when
you don't specify it explicitly, e.g.:

```sh
detox test   # translates to: mocha <...args> e2e
detox test e2e/01.sanity.test.js  # translates to: mocha <...args> e2e/01.sanity.test.js
```

Between 12.1.x and 12.3.x, it was buggy and used to work like this:

```sh
detox test   # translates to: mocha <...args> e2e
detox test e2e/01.sanity.test.js  # translates to: mocha <...args> e2e e2e/01.sanity.test.js
```

## Migrating from Detox 12.0.x to 12.1.x

This is not a breaking change yet, but starting from `detox@12.1.0` you'll start seeing warnings like:

```
detox[21201] WARN:  [deprecation.js] Beware: -f, --file will be removed in the next version of Detox.
detox[21201] WARN:  [deprecation.js] See the migration guide:
https://github.com/wix/Detox/blob/master/docs/Guide.Migration.md#migrating-from-detox-120x-to-121x
```

In the next major version `--file` and `--specs` will be treated as unknown arguments
and therefore passed as-is to your appropriate test runner. That allows to avoid name
conflict with the respective `--file` option in Mocha runner itself and other potential
collisions.

So, if you have been using CLI arguments like `--file e2e` or
`--specs e2e`, please drop the preceding `--file` and `--specs`, so that:

```
detox test --file e2e/01.sanity.test.js
```

becomes:

```
detox test e2e/01.sanity.test.js
```

**UPDATE:** It was decided not to deprecate `"specs"` in `package.json`, so the text below
is not relevant to a large extent. Please ignore the guide below.

~To get rid of this warning:~

* ~find `"specs"` or `"file"` entry in your project's `package.json` and empty it (e.g. `"e2e"` &#10230; `""`);~
* ~update your `detox test` scripts — make sure they have an explicit path to your Detox tests folder, e.g. `detox test e2e`.~

~For example, if it were a `package.json` before:~

```json
{
  "name": "your-project",
  "scripts": {
    "e2e:ios": "detox test -c ios.simulator.release"
  },
  "detox": {
    "specs": "e2e"
  }
}
```

~Then this is how it should look like afterwards:~

```json
{
  "name": "your-project",
  "scripts": {
    "e2e:ios": "detox test -c ios.simulator.release e2e"
  },
  "detox": {
    "specs": ""
  }
}
```

~Notice that we appended `e2e` to the `e2e:ios` test script and
emptied `"specs"` property in `detox` configuration.~

~In a case if you had no `"specs"` property in your `detox` configuration
in `package.json`, then please add it temporarily like this:~

```json
{
    "specs": ""
}
```

## Migrating from Detox 11.0.1 to 12.0.0

The new version explicity requires **Xcode 10.1 or higher** in order to run tests on iOS ([#1229](https://github.com/wix/Detox/issues/1229)).

## Migrating from Detox 11.0.0 to 11.0.1 (nonbreaking)

**React Native versions older than 0.46 are no longer supported**, so the `missingDimentsionStrategy` can be removed from `android/app/build.gradle`:

```diff
android {
		defaultConfig {
    		// ...
-        missingDimensionStrategy "minReactNative", "minReactNative46"
    }
}
```

## Migrating from Detox 10.x.x to 11.x.x

#### Step 1:

`android/app/build.gradle`

```diff
android {
    defaultConfig {
         // ...
-        testInstrumentationRunner "android.support.test.runner.AndroidJUnitRunner"
+        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    }
}

dependencies {
    implementation "com.facebook.react:react-native:+"  // From node_modules
    androidTestImplementation(project(path: ":detox"))
    androidTestImplementation 'junit:junit:4.12'
-   androidTestImplementation 'com.android.support.test:runner:1.0.2'
-   androidTestImplementation 'com.android.support.test:rules:1.0.2'
```

#### Step 2:

Rewrite your `DetoxTest.java` file according to the updated [Android setup guide](Introduction.Android.md#4-create-android-test-class) (step 4).

## Migrating from Detox 9.x.x to 10.x.x

If your project does not already use Kotlin, add the Kotlin Gradle-plugin to your classpath in `android/build.gradle`:

```groovy
buildscript {
    // ...
    ext.kotlinVersion = '1.3.0'
    
    dependencies {
        // ...
        classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlinVersion"
    }
}
```

_Note: most guides advise of defining a global `kotlinVersion` constant - as in this example, but that is not mandatory._


**IMPORTANT:** Detox aims at a playing fair with your app, and so it allows you to explicitly define the kotlin version for it to use - so as to align it with your own; Please do so - in your root `android/build.gradle` configuration file:

```groovy
buildscript {
    ext.kotlinVersion = '1.3.0' // Your app's version
    ext.detoxKotlinVersion = ext.kotlinVersion // Detox' version: should be 1.1.0 or higher!
}
```

***Note that Detox has been tested for version 1.1.0 of Kotlin, and higher!***


## Migrating from Detox 8.x.x to 9.x.x

Detox 9.0.0 brings latest Espresso (3.0.2), and React Native 56 support on Android.
Espresso 3.0.2 has a few mandatory dependency changes, which break the current setup for Detox users on Android.

Use this to diff to upgrade your dependencies, and follow Android Studio's in-editor guidance/lint support.

`android/app/build.gradle`

```diff

dependencies {
-   implementation "com.android.support:appcompat-v7:27.0.2"
+   implementation "com.android.support:appcompat-v7:27.1.1"
    implementation "com.facebook.react:react-native:+"  // From node_modules
    androidTestImplementation(project(path: ":detox"))
    androidTestImplementation 'junit:junit:4.12'
-   androidTestImplementation 'com.android.support.test:runner:1.0.1'
-   androidTestImplementation 'com.android.support.test:rules:1.0.1'
+   androidTestImplementation 'com.android.support.test:runner:1.0.2'
+   androidTestImplementation 'com.android.support.test:rules:1.0.2'
```

`android/build.gradle`

```diff
dependencies {
-   classpath 'com.android.tools.build:gradle:3.0.1'
+   classpath 'com.android.tools.build:gradle:3.1.4'
}
```

An example for the above changes can be found on [`demo-react-native` project](https://github.com/wix/detox/pull/914/files#diff-a4582798f3b7df5ccd62283b37b5573e)

More details about Espresso dependencies [here](https://developer.android.com/training/testing/espresso/setup)

## Migrating from Detox 7.x.x to 8.x.x

Detox 8.x.x brings support for test artifacts (videos, screenshot, logs), and to learn more about it you can refer to [Artifacts documentation](APIRef.Artifacts.md) and to [Detox CLI documentation](APIRef.DetoxCLI.md).

#### Changes to `e2e/init.js`

In order for Detox to be able to create artifacts, `detox.beforeEach(testSummary)` and `detox.afterEach(testSummary)` must be called with a current test summary object (test title, full test name, test status).

Detox 8 introduces adapters for both Mocha and Jest, wrapping the original `detox.beforeEach(testSummary)` and `detox.afterEach(testSummary)` functions, for easier integration.

you are encouraged to reuse the examples of `./e2e/init.js` for  [mocha](/examples/demo-react-native/e2e/init.js) and [jest](/examples/demo-react-native-jest/e2e/init.js). The gist is brought in the following sections:

##### *Mocha*

```js
const detox = require('detox');
const adapter = require('detox/runners/mocha/adapter');

before(async () => {
  await detox.init();
});

beforeEach(async function () {
  await adapter.beforeEach(this);
});

afterEach(async function () {
  await adapter.afterEach(this);
});

after(async () => {
  await detox.cleanup();
});
```

>*NOTICE:*
Make sure you use ES5 functions in `beforeEach` and `afterEach`. `this` referes to mocha's test object, using arrow functions will result with failure to to acquire a correct **`this`** inside the adapter.

```js
// ✗ INCORRECT

beforeEach(() => { /* ... your content ... */ }); // won't work
afterEach(() => { /* ... your content ... */ }); // won't work

// CORRECT

beforeEach(function ( /* ... your content ... */ ) {});
afterEach(function ( /* ... your content ... */ ) {});
```
##### *Jest*

```js
const detox = require('detox');
const adapter = require('detox/runners/jest/adapter');

jest.setTimeout(120000);
jasmine.getEnv().addReporter(adapter); // don't forget this line

beforeAll(async () => {
  await detox.init();
});

beforeEach(async () => {
  await adapter.beforeEach();
});

afterAll(async () => {
  await adapter.afterAll();
  await detox.cleanup();
});
```

> *NOTICE:*
Make sure to register the adapter as a Jasmine reporter in `init.js` like this:
```js
jasmine.getEnv().addReporter(adapter);
```
* Jest adapter requires a hook to `afterAll`:

```js
afterAll(async () => {
  await adapter.afterAll();
  await detox.cleanup();
});
```

##### Note regarding `detox.beforeEach` and `detox.afterEach`
API of these methods is subject to change in future versions due to complexity behind composing test summary objects (as in the case with Jest test runner). If you have reasons to make direct calls to `detox.beforeEach` and `detox.afterEach` (e.g. you're adding support for another test runner), please refer to [detox object documentation](APIRef.DetoxObjectAPI.md).

#### Changes to `detox test` CLI

The `--artifact-location` argument became optional for `detox test` in the version 8.x.x.
By default it dynamically creates `./artifacts/{configuration}.{timestamp}` directory in the project folder as soon as it has to save a recorded artifact.

Previously, to enable log recording you just had to specify `--artifact-location` arg. Currently, you need to tell that explicitly via a new CLI flag: `--record-logs all` or `--record-logs failing`.

Notice that `--artifact-location` became sensitive to whether you end your directory path with a slash or not. It has the next convention:

* If you want to create automatically a subdirectory with timestamp and configuration name (to avoid file overwrites upon consquent reruns), specify a path to directory that *does not end* with a slash.
* Otherwise, if you want to put artifacts straight to the specified directory (in a case where you make a single run only, e.g. on CI), *add a slash* to the end.

For more information see [CLI documentation](APIRef.DetoxCLI.md).

## Migrating from Detox 4.x.x to 5.x.x
The clearest example for for the 4->5 API changes is the change log of detox's own test suite.
Check [detox test change log](https://github.com/wix/detox/commit/c636e2281d83d07fe0b479681c1a8a6b809823ff#diff-bf5e338e4f0bb49210688c7691dc8589) for a real life example.

###Version 5.x.x breaks detox's API in 4 different places

#### 1. Promise based flow
All of the API calls are now promise based, and must use either promise chains or async-await.

Here's an example of async call to tap an element

```js
// <=4.x.x
beforeEach(() => {
  element(by.text('Sanity')).tap();
});		    

```

```js
// 5.x.x
beforeEach(async () => {
  await element(by.text('Sanity')).tap();
});
```

Same thing with expectations

```js 
// <=4.x.x
it('should have welcome screen', () => {
  expect(element(by.text('Welcome'))).toBeVisible();
  expect(element(by.text('Say Hello'))).toBeVisible(); 
  expect(element(by.text('Say World'))).toBeVisible();
};
```

```js
// 5.x.x
it('should have welcome screen', async () => {
  await expect(element(by.text('Welcome'))).toBeVisible();
  await expect(element(by.text('Say Hello'))).toBeVisible();
  await expect(element(by.text('Say World'))).toBeVisible();
});
```

#### 2. `detox` object has a leaner API

Configure and init detox with just one promise based function.

```js
// <=4.x.x
detox.config(config);
detox.start(done);
```

```js
// 5.x.x
await detox.init(config);
```

No need to wait for test result after each test, you can safely remove `detox.waitForTestResult`

```js
// <=4.x.x
afterEach((done) => {
  detox.waitForTestResult(done);
});
```

cleanup is promise based
```js
// <=4.x.x
detox.cleanup(done);
```

```js
// 5.x.x
await detox.cleanup();
```

#### 3. `simulator` is now `device`
The global object `simulator` is now `device`, this change makes sense when thinking about multi-platform tests (Android support).
Along with the new promise based API, this is how we now control the attached device

<=4.x.x | 5.x.x
------|--------
`simulator.reloadReactNativeApp(done)`	| `await device.reloadReactNative()`
`simulator.relaunchApp(done)`				| `await device.relaunchApp()`
`simulator.sendUserNotification(params, done)` | `await device.sendUserNotification(params)`
`simulator.openURL(url)`					| `await device.openURL(url)`

#### 4. Detox config scheme
In order for our API to support multiple platforms and devices, and to be able to provide a valid command line tool, we changed the the detox configuration scheme (in package.json)

Previous config looked like this:

```json
//<=4.x.x
  "detox": {
    "session": {
      "server": "ws://localhost:8099",
      "sessionId": "test"
    },
    "ios-simulator": {
        "app": "ios/build/Build/Products/Release-iphonesimulator/example.app",
        "device": "iPhone 7 Plus"
    }
  }
```

The new configuration holds a dictionary of `configurations`.

1. Each configuration must state `type` - currently only simulator is supported
2. `app` is now `binaryPath`
3. `build` - **[optional]** build command (either `xcodebuild`, `react-native run-ios`, etc...), will be later available through detox CLI tool.
4. **session object is not mandatory anymore**, if is not provided detox will handle server creation by itself.

```json
//5.x.x
  "detox": {
    "configurations": {
      "ios.sim.release": {
        "binaryPath": "ios/build/Build/Products/Release-iphonesimulator/example.app",
        "build": "xcodebuild -project ios/example.xcodeproj -scheme example -configuration Release -sdk iphonesimulator -derivedDataPath ios/build",
        "type": "ios.simulator",
        "name": "iPhone 7 Plus"
      }
    } 
  }
```

#### 3.1 Start using detox-cli 
You will now be able to run builds and tests from your command line `detox build` and `detox test`, read more about CLI tools [here]()

## Migrating from Detox 3.x.x to 4.x.x
If you have integrated with Detox in version 3.x.x, you will need to clean your project from previously generated targets.

* Use the provided `cleanup_4.0.rb` to remove unneeded changes made with Detox 4.x.x.

	```sh
	ruby node_modules/detox/scripts/cleanup_4.0.rb
	```

* The script will delete previously configured project targets `*_Detox`. The targets are not used by detox anymore since the framework is now injected at runtime and doesn't need to be linked in a different target.
* Make sure to add changes performed by running this script to version control.


