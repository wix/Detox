# Internals API

:::caution

This section might be more volatile than the other ones, yet we'll do our
best to adhere to Semantic Release standards even here.

:::

Detox Internals might be useful for developing advanced enterprise presets
or if you are planning to integrate with a third-party test runner like
[Mocha], [Ava], [Vitest] or other ones.

## Main lifecycle

### `resolveConfig`

Use with a caution, when you still have no config, yet need to avoid \[internals.init()]\[#init] call.

You normally don’t need it if you use Detox CLI (`detox test …`), but if you want to start tests
directly and you need to have the config resolved before \[internals.init()]\[#init] is called, this
is the way to go.

### `getStatus`

Returns a string (`inactive`, `init`, `active` or `cleanup`) depending on what’s going on.

### `init`

This is the phase where Detox reads its configuration, starts a server.

### `cleanup`

The global cleanup phase should happen after all the tests have finished.
This is the phase where the Detox server shuts down.

### `installWorker`

This is the phase where Detox loads its expectation library and starts a device.

### `uninstallWorker`

Deallocates the device.

## Optional lifecycle

### Synchronizing with artifacts manager

The naming you can see adheres much to Jest Circus workflow:

- `onRunStart`
- `onRunDescribeStart`
- `onTestStart`
- `onHookStart`
- `onHookFailure`
- `onHookSuccess`
- `onTestFnStart`
- `onTestFnFailure`
- `onTestFnSuccess`
- `onTestDone`
- `onRunDescribeFinish`
- `onRunFinish`

### Reporting test results

`reportTestResults` reports to Detox CLI about failed tests that could
have been re-run if `--retries` is set to a non-zero.

It takes one argument, an array of test file reports. Each report is an object with the following properties:

- `testFilePath` (string) — global or relative path to the failed test file;
- `success` (boolean) — whether the test passed or not;
- `testExecError` (optional error) — top-level error if the entire test file failed;
- `isPermanentFailure` (optional boolean) — if the test failed, it should tell whether the failure is permanent. Permanent failure means that the test file should not be re-run.

## Properties

### config

### session

### log

### `tracing`

`tracing.createEventStream()` – creates a readable stream of the currently recorded events in
[Chrome Trace Event format](https://docs.google.com/document/d/1CvAClvFfyA5R-PhYUmn5OOQtYMH4h6I0nSsKchNAySU).

See also: [`DurationBeginEvent`], [`DurationEndEvent`], [`InstantEvent`].

### worker

Not documented on purpose. Provides the direct access to the object which
holds the device driver, websocket client, matchers, expectations, etc.

[Mocha]: https://mochajs.org

[Ava]: https://github.com/avajs/ava

[Vitest]: https://vitest.dev

[`DurationBeginEvent`]: https://wix-incubator.github.io/trace-event-lib/interfaces/DurationBeginEvent.html

[`DurationEndEvent`]: https://wix-incubator.github.io/trace-event-lib/interfaces/DurationEndEvent.html

[`InstantEvent`]: https://wix-incubator.github.io/trace-event-lib/interfaces/InstantEvent.html
