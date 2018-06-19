---
id: APIRef.DetoxObjectAPI
title: The `detox` Object
---

`detox` is globally available in every test file, though currently it is only used in the setup/init file.

>NOTE: detox is test runner independent, and we encourge you to choose your own test runner, but for the sake of demonstration we will use `mocha`'s syntax.

### Methods

- [`detox.init()`](#detox.init)
- [`detox.beforeEach()`](#detox.beforeEach)
- [`detox.afterEach()`](#detox.afterEach)
- [`detox.cleanup()`](#detox.cleanup)

### `detox.init()`
The setup phase happens inside `detox.init()`. This is the phase where detox reads its configuration, starts a server, loads its expection library and starts a simulator.

##### (if you're using mocha) In your `init.js` add:

```js
const config = require('../package.json').detox;

before(async () => {
  await detox.init(config);
});
```

##### Explicit imports during initialization 
Detox exports `device `, `expect`, `element`, `by` and `waitFor` as globals by default, if you want to control their initialization manually, set init detox with `initGlobals` set to `false`. This is useful when during E2E tests you also need to run regular expectations in node. jest `Expect` for instance, will not be overriden by Detox when this option is used.

```js
before(async () => {
  await detox.init(config, {initGlobals: false});
});
```

Then import them manually:

```js
const {device, expect, element, by, waitFor} = require('detox');
```

Use [this example](../examples/demo-react-native/e2eExplicitRequire) for initial setup



#### Controlling first app intialization
By default `await detox.init(config);` will launch the installed app. If you wish to control when your app is launched, add `{launchApp: false}` param to your init.

```js
const config = require('../package.json').detox;

before(async () => {
  await detox.init(config, {launchApp: false});
});
```

>NOTE: Detox 6.X.X introduced a **breaking change** , setting `launchApp` to `false` by default. In order to prevent any breaking changes to your tests when you upgrade (and if you still would like `init` to launch the app for you) do the following:

```js
before(async () => {
  await detox.init(config, {launchApp: true});
});
```

### `detox.beforeEach()`

This method should be called at the start of every test to let Detox's artifacts lifecycle know it is the time to start recording logs and videos, or to take another `beforeEach.png` screenshot. Although this is one of usage of `beforeEach`, Detox does not limit itself to this usage and may utilize calls to `beforeEach` for additional purposes in the future.

```typescript
declare function beforeEach(testSummary: {
  title: string;
  fullName: string;
  status: 'running';
})
```

Usually, you are not supposed to write own implementation of this call, instead rely on Detox in-house adapters for [mocha](/examples/demo-react-native/e2e/init.js) and [jest](/examples/demo-react-native-jest/e2e/init.js) as in the examples. It should alleviate transitions to newer Detox versions for you as the chances are that API specification won't prove itself as sufficient and it may undergo rewrites and extensions.

> NOTE: If you are implementing support for a test runner different from Mocha and Jest, please keep in mind that *pending* (also known as *skipped*) tests should not trigger `detox.beforeEach()` at all, neither `detox.afterEach()`. The rule of thumb is either you guarantee you call them both, or you don't call anyone.

### `detox.afterEach()`

You are expected to call this method only after the test and all its inner `afterEach()`-es complete. Besides passing test title and full name you should pay heed on delivering a valid status field: *failed* or *passed*. If the test has another status (e.g. *skipped*), please comply to the note above in [detox.beforeEach()](#detox.beforeEach) or use one of these two values as a fallback.

```typescript
declare function afterEach(testSummary: {
  title: string;
  fullName: string;
  status: 'failed' | 'passed';
})
```

Normally, you are not supposed to write own implementation of this call, as mentioned earlier in the [detox.beforeEach()](#detox.beforeEach) documentation.

### `detox.cleanup()`
The cleanup phase should happen after all the tests have finished. This is the phase where detox-server shuts down. The simulator will also shut itself down if `--cleanup` flag is added to `detox test`

##### (if you're using mocha) In your `init.js` add:

```js
after(async () => {
  await detox.cleanup();
});
```
