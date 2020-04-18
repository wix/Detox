# Jest setup guide

This guide describes how to install [Jest](https://jestjs.io) as the test runner to be used by Detox for effectively running the E2E tests.

**Disclaimer:**

1. The guide describes installing Detox with Jest on a _fresh project_. If you're migrating an existing project, use the guide but please apply some common sense in the process.
1. The guide has been officially tested only with `jest-circus@^25.3.0`. We cannot guarantee that everything would work with older versions.

## Introduction

As already mentioned in the [Getting Started](Introduction.GettingStarted.md#step-3-create-your-first-test) guide, Detox itself does not effectively run tests logic, but rather delegates that responsibility onto a test runner. Jest is the recommended runner for projects with test suites that have become large enough so as to require parallel execution.

Do note that in turn, Jest itself - much like Detox, also does not effectively run any tests;
Rather, it is more of a dispatcher and orchestrator of multiple instances of a delegated runner, capable of running in parallel (for more info, refer to [this video](https://youtu.be/3YDiloj8_d0?t=2127); source: [Jest architecture](https://jestjs.io/docs/en/architecture)).

The recommended concrete runner is [`jest-circus`](https://www.npmjs.com/package/jest-circus), which is used by default with Detox because of the planned features, and also bugs in `jest-jasmine2` that are not maintained ([see this one](https://github.com/facebook/jest/issues/6755) in particular).

This guide covers only the setup of Detox with `jest-circus`. Use of `jest-jasmine2` runner is discouraged
due to upcoming deprecation and the former guide can be accessed only
[via Git history](https://github.com/wix/Detox/blob/ef466822129a4befcda71111d02b1a334539889b/docs/Guide.Jest.md)
in case if you still need it.

## Installation

### 1. Install Jest

Before starting out with Jest, please be sure to go over the fundamentals of the [Getting Started](Introduction.GettingStarted.md) guide,
especially **steps 1 and 2**.

Afterwards, install the respective npm packages:

```sh
npm install --save-dev jest jest-circus
```

If you had one of them installed before in your project,
make sure that `jest` and `jest-circus` versions match (e.g. both are `25.3.0`).

### 2. Set up test-code scaffolds

Run an automated init script:

```sh
detox init -r jest
```
> **Note:** errors occurring in the process may appear in red.

### 3. Fix / Verify

Even if `detox init` goes well and everything is green, we still recommend going
over the checklist below, optionally using our homebrewed
[`demo-react-native-jest`](https://github.com/wix/Detox/tree/master/examples/demo-react-native-jest)
example project as a reference in case of ambiguities.

#### package.json

| Property               | Value                                          | Description                                                  |
| ---------------------- | ---------------------------------------------- | ------------------------------------------------------------ |
| `detox.test-runner`    | `"jest"`                                       | *Required.* Should be `"jest"` for the proper `detox test` CLI functioning. |
| `detox.runner-config ` | (optional path to Jest config file)            | *Optional.* This field tells `detox test` CLI where to look for Jest's config file. If omitted, the default value is `e2e/config.json`. |

A typical `detox` configuration in a `package.json`file:

```json
{
  "detox": {
    "test-runner": "jest",
    "runner-config": "e2e/config.json",
    "configurations": {
      "ios.sim.release": {
        "type": "ios.simulator",
        "binaryPath": "ios/build/Build/Products/Release-iphonesimulator/example.app",
        "build": "...",
        "device": {
          "type": "iPhone 11 Pro"
        }
      }
    }
  }
}
```

#### e2e/config.json

| Property               | Value                                          | Description                                                  |
| ---------------------- | ---------------------------------------------- | ------------------------------------------------------------ |
| `testEnvironment `     | `detox/runners/jest/environment`               | *Required*. Needed for the proper functioning of Jest and Detox. |
| `testRunner `          | `jest-circus/runner`                           | *Required*. Indicates which files to run before each test suite. The field was [introduced in Jest 24](https://jestjs.io/docs/en/configuration#setupfilesafterenv-array). |
| `setupFilesAfterEnv `  | `["./init.js"]`                                | *Required*. Indicates which files to run before each test suite. The field was [introduced in Jest 24](https://jestjs.io/docs/en/configuration#setupfilesafterenv-array). |
| `reporters`            | `["detox/runners/jest/streamlineReporter"]`    | *Optional.* Available since  Detox `12.7.0`. Sets up our highly recommended `streamline-reporter` [Jest reporter](https://jestjs.io/docs/en/configuration#reporters-array-modulename-modulename-options), tailored for running end-to-end tests in Jest - which in itself was mostly intended for running unit tests. For more details, [see the migration guide](Guide.Migration.md#migrating-to-1270-from-older-nonbreaking). |
| `verbose`              | `true`                                         | Must be `true` if you have replaced Jest's `default` reporter with Detox's `streamlineReporter`. Optional otherwise. |

A typical `jest-circus` configuration in `e2e/config.json` file:

```json
{
  "setupFilesAfterEnv": ["./init.js"],
  "testRunner": "jest-circus/runner",
  "testEnvironment": "detox/runners/jest/environment",
  "reporters": ["detox/runners/jest/streamlineReporter"],
  "verbose": true
}
```

#### e2e/init.js

See [an example](https://github.com/wix/Detox/blob/master/examples/demo-react-native-jest/e2e/init.js) of custom Jest init script.

```js
const detox = require('detox');
const config = require('../package.json').detox;
const adapter = require('detox/runners/jest/adapter');
const specReporter = require('detox/runners/jest/specReporter');
const assignReporter = require('detox/runners/jest/assignReporter');

detoxCircus.getEnv().addEventsListener(adapter);
detoxCircus.getEnv().addEventsListener(assignReporter);
detoxCircus.getEnv().addEventsListener(specReporter);

// Set the default timeout
jest.setTimeout(90000);

beforeAll(async () => {
  await detox.init(config);
}, 300000);

beforeEach(async () => {
  await adapter.beforeEach();
});

afterAll(async () => {
  await adapter.afterAll();
  await detox.cleanup();
});
```

**Notes:**

- `beforeAll()`, `beforeEach()`, `afterAll()` should be registered as hooks
  for invoking `detox` and/or a custom adapter.
- (Recommended) Starting Detox `12.7.0`, an additional, custom `spec-reporter` should be registered as a `jasmine` reporter, as well. This one takes care of logging on a per-spec basis (i.e. when `it`'s start and end) — which Jest does not do by default.
  Should be used in conjunction with the Detox-Jest adapter.

This is how a typical Jest log output looks when a `streamline-reporter` is set up in `config.json` and
`specReporter` is added in `e2e/init.js`:

![Streamlined output](img/jest-guide/streamlined_logging.png)

## Writing Tests

There are some things you should notice:

- Don't worry about mocks being used, Detox works on the compiled version of your app.
- Detox exposes it's primitives (`expect`, `device`, ...) globally, it will override Jest's global `expect` object.

## Parallel Test Execution

Through Detox' CLI, Jest can be started with [multiple workers](Guide.ParallelTestExecution.md) that run tests simultaneously. In this mode, Jest effectively assigns one worker per each test file.
Per-spec logging offered by the `spec-reporter` mentioned earlier, does not necessarily make sense, as the workers' outputs get mixed up.

By default, we disable `spec-reporter` in a multi-workers environment.
If you wish to force-enable it nonetheless, the [`--jest-report-specs`](APIRef.DetoxCLI.md#test) CLI option can be used
with `detox`.

## How to run unit test and E2E tests in the same project

- If you have a setup file for the unit tests pass `./jest/setup` implementation into your unit setup.
- Call your E2E tests using `detox-cli`: `detox test`