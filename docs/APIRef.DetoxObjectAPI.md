# The `detox` Object

`detox` is globally available in every test file, though currently it is only used in the setup/init file.

>NOTE: detox is test runner independent, and we encourage you to choose your own test runner, but for the sake of demonstration we will use `mocha`'s syntax.

### Methods

- [`detox.init()`](#detoxinit)
- [`detox.beforeEach()`](#detoxbeforeeach)
- [`detox.afterEach()`](#detoxaftereach)
- [`detox.cleanup()`](#detoxcleanup)
- [`detox.traceCall()`](#detoxtracecall)
- [`detox.trace.startSection(), detox.trace.endSection()`](#detoxtracestartsection,-detoxtraceendsection)

### `detox.init()`
The setup phase happens inside `detox.init()`. This is the phase where detox reads its configuration, starts a server, loads its expection library and starts a simulator.

##### (if you're using mocha) In your `init.js` add:

```js
const detox = require('detox');

before(async () => {
  await detox.init();
});
```

##### Explicit imports during initialization
Detox exports `device`, `expect`, `element`, `by` and `waitFor` as globals by default, if you want to control their initialization manually, set init detox with `initGlobals` set to `false`. This is useful when during E2E tests you also need to run regular expectations in node. jest `Expect` for instance, will not be overridden by Detox when this option is used.

```js
const detox = require('detox');

before(async () => {
  await detox.init(undefined, {initGlobals: false});
});
```

Then import them manually:

```js
const {device, expect, element, by, waitFor} = require('detox');
```

Use [this example](../examples/demo-react-native/e2eExplicitRequire) for initial setup

#### Reusing existing app

By default `await detox.init();` will uninstall and install the app. If you wish to reuse the existing app for a faster run, add `{reuse: true}` param to your init.

```js
before(async () => {
  await detox.init(undefined, {reuse: true});
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
The cleanup phase should happen after all the tests have finished. This is the phase where detox server shuts down. The simulator will also shut itself down if `--cleanup` flag is added to `detox test`

##### (if you're using mocha) In your `init.js` add:

```js
after(async () => {
  await detox.cleanup();
});
```

### `detox.traceCall()`

:warning: **Beta**

Trace a subprocess of your test's runtime such that it would leave traces inside the [Timeline artifact](APIRef.Artifacts.md#timeline-plugin), for a later inspection.

Example:

```js
it('Verify sanity things', async () => {
  // Instead of this typical direct call:
  // await element(by.id('sanityButton')).tap()
  
  // Use traceCall() as a wrapper:
  await detox.traceCall('Navigate to sanity', () =>
    element(by.id('sanityButton')).tap());
});
```

This would have the `tap` action traced to the final artifact, so it would look something like this:

![User event](img/timeline-artifact-userEvent.png)

At the bottom right, you can see what portion of the test was spent in handling the whole navigation process: tap + screen push + screen rendering (i.e. action time, alongside Detox' inherent wait for the application to become idle).

### `detox.trace.startSection(), detox.trace.endSection()`

:warning: **Beta**

This is similar to the `traceCall()` API, except that it gives more freedom with respect to when a section's start and ending times are defined, so as to monitor a nontrivial flow. As a usage example:

```js
it('Verify sanity things', async () => {
  try {
    detox.trace.startSection('Turn off notifications');
    await element(by.id('gotoNotifications')).tap();
    await element(by.id('notificationsToggle')).tap();
    await device.pressBack();    
  } finally {
    detox.trace.endSection('Turn off notifications');    
  }
});
```

Effectively, `start` and `end` can even be called in two complete different places - such as a `before` and an `after`. But that is discouraged. In fact, **usage of `detox.traceCall()` is the recommended way of tracing things, altogether.**

