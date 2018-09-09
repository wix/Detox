---
id: Guide.Migration
title: Migration Guide
---

We are improving detox API as we go along, sometimes these changes require us to break the API in order for it to make more sense. These migration guides refer to breaking changes.

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
const config = require('../package.json').detox;
const adapter = require('detox/runners/mocha/adapter');

before(async () => {
  await detox.init(config);
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
const config = require('../package.json').detox;
const adapter = require('detox/runners/jest/adapter');

jest.setTimeout(120000);
jasmine.getEnv().addReporter(adapter); // don't forget this line

beforeAll(async () => {
  await detox.init(config);
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

* If you want to create automatically a subdirectory with timestamp and configuration name (to avoid file overwrites upon consquent re-runs), specify a path to directory that *does not end* with a slash.
* Otherwise, if you want to put artifacts straight to the specified directory (in a case where you make a single run only, e.g. on CI), *add a slash* to the end.

For more information see [CLI documentation](APIRef.DetoxCLI.md).

## Migrating from Detox 4.x.x to 5.x.x
The clearest example for for the 4->5 API changes is the change log of detox's own test suite.
Check [detox test change log](https://github.com/wix/detox/commit/c636e2281d83d07fe0b479681c1a8a6b809823ff#diff-bf5e338e4f0bb49210688c7691dc8589) for a real life example.

###Version 5.x.x breaks detox's API in 4 different places

#### 1. Promise based flow
All of the API calls are now promise based, and must use either promise chains or async-await.<br>

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


