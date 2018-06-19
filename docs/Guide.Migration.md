---
id: Guide.Migration
title: Migration Guide
---

We are improving detox API as we go along, sometimes these changes require us to break the API in order for it to make more sense and. These migration guides refer to breaking changes.

## Migrating from detox 7.x.x to 8.x.x

The new `detox@8` brings support for test artifacts (videos, screenshot, logs), and to learn more about it you can refer to [Artifacts documentation](APIRef.Artifacts.md) and to [Detox CLI documentation](APIRef.DetoxCLI.md).

#### Changes to e2e/init.js

To make the artifacts feature work, you have to call `detox.beforeEach(testSummary)` and `detox.afterEach(testSummary)` with a current test summary object (test title, full test name, test status).

As the API of the methods is a subject to change in the future versions and
there is complexity behind composing test summary objects (as in the case with Jest test runner),
you are encouraged to reuse the examples of `./e2e/init.js` for  [mocha](/examples/demo-react-native/e2e/init.js) and [jest](/examples/demo-react-native-jest/e2e/init.js).

If you have reasons to make direct calls to `detox.beforeEach` and `detox.afterEach` (e.g. you're adding support for another test runner), please refer to [detox object documentation](APIRef.DetoxObjectAPI.md).

##### Editing tips

* **Mocha**. Make sure you use ES5 functions in `beforeEach` and `afterEach`.  If you erroneously use arrow functions, then inside you'll fail to get a correct **`this`**  to pass to the adapter.

```js
// ✗ INCORRECT

beforeEach(() => { /* ... your content ... */ }); // won't work
afterEach(() => { /* ... your content ... */ }); // won't work

// CORRECT

beforeEach(function ( /* ... your content ... */ ) {});
afterEach(function ( /* ... your content ... */ ) {});
```

* **Jest.**
	* Make sure you register the adapter as a Jasmine reporter in `init.js` like this:
	```js
	jest.setTimeout(120000);
	jasmine.getEnv().addReporter(adapter); // don't forget this line
	```
	* And yes, it is correct that instead of `afterEach` you [call the adapter](/examples/demo-react-native-jest/e2e/init.js#L18) in `afterAll`:
	```js
	afterAll(async () => {
	  await adapter.afterAll();
	  await detox.cleanup();
	});
	```

#### Changes to `detox test` CLI

The `--artifact-location` argument became optional for `detox test` in the version 8.0.0.
By default it dynamically creates `./artifacts/{configuration}.{timestamp}` directory in the project folder as soon as it has to save a recorded artifact.

Previously, to enable log recording you just had to specify `--artifact-location` arg. Currently, you need to tell that explicitly via a new CLI flag: `--record-logs all` or `--record-logs failing`.

Notice that `--artifact-location` became sensitive to whether you end your directory path with a slash or not. It has the next convention:

* If you want to create automatically a subdirectory with timestamp and configuration name (to avoid file overwrites upon consquent re-runs), specify a path to directory that *does not end* with a slash.
* Otherwise, if you want to put artifacts straight to the specified directory (in a case where you make a single run only, e.g. on CI), *add a slash* to the end.

For more information see [CLI  documentation](APIRef.DetoxCLI.md).

## Migrating from detox 4.x.x to 5.x.x
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

## Migrating from detox 3.x.x to 4.x.x
If you have integrated with detox in version 3.x.x, you will need to clean your project from previously generated targets.

* Use the provided `cleanup_4.0.rb` to remove unneeded changes made with Detox 4.x.x.

	```sh
	ruby node_modules/detox/scripts/cleanup_4.0.rb
	```

* The script will delete previously configured project targets `*_Detox`. The targets are not used by detox anymore since the framework is now injected at runtime and doesn't need to be linked in a different target.
* Make sure to add changes performed by running this script to version control.


