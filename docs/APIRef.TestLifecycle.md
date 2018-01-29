---
id: APIRef.TestLifecycle
title: Test Lifecycle
---

Detox is test runner independent, and we encourge you to choose your own test runner, but for the sake of demonstration we will use `mocha`'s syntax.


### Initial Setup
The setup phase happens inside `detox.init()`. This is the phase where detox reads its configuration, starts a server, loads its expection library and starts a simulator.

```js
const config = require('../package.json').detox;

before(async () => {
  await detox.init(config);
});
```

Of course, you can add any of your initilizations in this phase.

### Teardown
The cleanup phase should happen after all the tests have finished, can be initiated using `detox.cleanup()`. This is the phase where detox-server shuts down. The simulator will also shut itself down if `--cleanup` flag is added to `detox test`

```js
after(async () => {
  await detox.cleanup();
});
```

### Repeating Setup For All Tests

A good practice for testing in general is to have decoupled tests, meaning that each test has the same starting point, and the tests can run in any order and still produce the same results. We strongly encourage either restarting your application or restart react-native (if your application is built with it).

##### Reloading React Native

```js
  beforeEach(async () => {
    await device.reloadReactNative();
  });
```

##### Reloading The Entire App

```js
  beforeEach(async () => {
    await device.relaunchApp();
  });
```
