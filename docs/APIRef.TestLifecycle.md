# Test Lifecycle

Detox is test runner independent, and we encourage you to choose your own test runner, but for the sake of demonstration we will use `mocha`'s syntax.

## Initial Setup

The setup phase happens inside `detox.init()`.
This is the phase where detox reads its configuration, starts a server, loads its expection library and starts a simulator.

```js
before(async () => {
  await detox.init();
});
```

Of course, you can add any of your initializations in this phase.

## Before and After Each Test

Despite being a recent and *still* an optional formation, `detox.beforeEach` and `detox.afterEach` lifecycle functions are **highly** recommended to be called in your test setups. The newer features (including test artifacts: video recordings, screenshots, logs) are not expected to work without these calls.

> **TIP**: This API is still apt to change in future, thus to minimize the risks, you are encouraged to switch to the built-in adapters for `mocha` and `jest` like in examples here: [mocha adapter example](/examples/demo-react-native/e2e/init.js), [jest adapter example](/examples/demo-react-native-jest/e2e/init.js).

If nevertheless you use another test runner with Detox (not `mocha` and not `jest`), then you have to implement a logic similar to the one below. Futurewise, consider refactoring it to an adapter and sharing with Detox project (e.g. adapter for `ava.js` or `tape`):

```js
let testSummary;

beforeEach(async function () {
  testSummary = {
    title: this.currentTest.title,
    fullName: this.currentTest.fullTitle(),
    status: 'running',
  };

 await detox.beforeEach(testSummary);
});

afterEach(async function () {
  testSummary.status = this.currentTest.state || 'failed';
  await detox.afterEach(testSummary);
});
```

## Teardown

The cleanup phase should happen after all the tests have finished, can be initiated using `detox.cleanup()`. This is the phase where detox server shuts down. The simulator will also shut itself down if `--cleanup` flag is added to `detox test`

```js
after(async () => {
  await detox.cleanup();
});
```

## Repeating Setup for All Tests

A good practice for testing in general is to have decoupled tests, meaning that each test has the same starting point, and the tests can run in any order and still produce the same results. We strongly encourage either restarting your application or restart react-native (if your application is built with it).

##### Reloading React Native

```js
  beforeEach(async () => {
    await device.reloadReactNative();
  });
```

##### Relaunching the Entire App

```js
  beforeEach(async () => {
    await device.launchApp({newInstance: true});
  });
```
