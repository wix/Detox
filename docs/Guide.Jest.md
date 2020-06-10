# Jest setup guide

> **NOTE: This article previously focused on deprecated `jest-jasmine2` runner setup, and if for some reason you need to access it, [follow this Git history link](https://github.com/wix/Detox/blob/ef466822129a4befcda71111d02b1a334539889b/docs/Guide.Jest.md).**


This guide describes how to install [Jest](https://jestjs.io) as a test runner to be used by Detox for running the E2E tests.

**Disclaimer:**

1. Here we focus on installing Detox on _new projects_. If you're migrating a project with an existing Detox installation, use the guide but please apply some common sense in the process.
1. The instructions were tested on `jest-circus@^26.0.1`. Most likely, newer versions would work too, but **the older ones** (25.x, 24.x) **are not supported** due to major issues.

## Introduction

As already mentioned in the [Getting Started](Introduction.GettingStarted.md#step-3-create-your-first-test) guide, Detox itself does not effectively run tests logic, but rather delegates that responsibility onto a test runner. Jest is the recommended runner for projects with test suites that have become large enough so as to require parallel execution.

Do note that in turn, Jest itself - much like Detox, also does not effectively run any tests;
Rather, it is more of a dispatcher and orchestrator of multiple instances of a delegated runner, capable of running in parallel (for more info, refer to [this video](https://youtu.be/3YDiloj8_d0?t=2127); source: [Jest architecture](https://jestjs.io/docs/en/architecture)).

Detox has complete support for only one Jest concrete runner, which is [`jest-circus`](https://www.npmjs.com/package/jest-circus). The other runner, `jest-jasmine2` is deprecated due to certain bugs in the past, and architectural limitations in the present. Moreover, Jest team plans to deprecate `jest-jasmine2` in the upcoming major release 27.0.0 ([see blog post](https://jestjs.io/blog/2020/05/05/jest-26)).

Detox used to support the older, now deprecated `jest-jasmine2`, and, if you need for some reason to check with the archived version of Jest setup guide, [follow this link](https://github.com/wix/Detox/blob/ef466822129a4befcda71111d02b1a334539889b/docs/Guide.Jest.md).

## Installation

### 1. Install Jest

Before starting out with Jest, please be sure to go over [Getting Started](Introduction.GettingStarted.md) guide,
especially **steps 1 and 2**.

Afterwards, install the respective npm packages:

```sh
npm install --save-dev jest jest-circus
```

If you previously had `jest` installed in your project,
make sure that `jest` and `jest-circus` versions match (e.g. both are `26.0.1`).

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

#### .detoxrc.json

| Property               | Value                                          | Description                                                  |
| ---------------------- | ---------------------------------------------- | ------------------------------------------------------------ |
| `test-runner`    | `"jest"`                                       | *Required.* Should be `"jest"` for the proper `detox test` CLI functioning. |
| `runner-config ` | (optional path to Jest config file)            | *Optional.* This field tells `detox test` CLI where to look for Jest's config file. If omitted, the default value is `e2e/config.json`. |

A typical Detox configuration in `.detoxrc.json` file looks lke:

```json
{
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
```

#### e2e/config.json

| Property               | Value                                          | Description                                                  |
| ---------------------- | ---------------------------------------------- | ------------------------------------------------------------ |
| `testEnvironment `     | `./environment`               | *Required*. Needed for the proper functioning of Jest and Detox. |
| `testRunner `          | `jest-circus/runner`                           | *Required*. Needed for the proper functioning of Jest and Detox. |
| `testTimeout `          | `120000`                           | *Required*. Overrides the default timeout (5 seconds) which is usually too short to complete steps in E2E test scenario. |
| `reporters`            | `["detox/runners/jest/streamlineReporter"]`    | *Recommended.* Available since  Detox `12.7.0`. Sets up our highly recommended `streamline-reporter` [Jest reporter](https://jestjs.io/docs/en/configuration#reporters-array-modulename-modulename-options), tailored for running end-to-end tests in Jest - which in itself was mostly intended for running unit tests. For more details, [see the migration guide](Guide.Migration.md#migrating-to-1270-from-older-nonbreaking). |
| `verbose`              | `true`                                         | Must be `true` if you have replaced Jest's `default` reporter with Detox's `streamlineReporter`. Optional otherwise. |

A typical `jest-circus` configuration in `e2e/config.json` file:

```json
{
  "testRunner": "jest-circus/runner",
  "testEnvironment": "./environment",
  "testTimeout": 120000,
  "reporters": ["detox/runners/jest/streamlineReporter"],
  "verbose": true
}
```

#### e2e/environment.js

For Detox, having a custom `Environment` class enables implementing cross-cutting concerns such as taking screenshots the exact moment a test function (it/test) or a hook (e.g., beforeEach) fails, skip adding tests if they have `:ios:` or `:android:` within their title, starting device log recordings before test starts and so on.

Its API is not entirely public in a sense that there's no guide on how to write custom `DetoxCircusListeners` and override `initDetox()` and `cleanupDetox()` protected methods, since this is not likely to be needed for typical projects, but this is under consideration if there appears specific demand.

See [an example](https://github.com/wix/Detox/blob/master/examples/demo-react-native-jest/e2e/init.js) of a custom Detox environment for Jest.

```js
const {
  DetoxCircusEnvironment,
  SpecReporter,
  WorkerAssignReporter,
} = require('detox/runners/jest-circus');

class CustomDetoxEnvironment extends DetoxCircusEnvironment {
  constructor(config) {
    super(config);

    // Can be safely removed, if you are content with the default value (=300000ms)
    this.initTimeout = 300000;

    // This takes care of generating status logs on a per-spec basis. By default, Jest only reports at file-level.
    // This is strictly optional.
    this.registerListeners({
      SpecReporter,
      WorkerAssignReporter,
    });
  }
}

module.exports = CustomDetoxEnvironment;
```

**Notes:**

- The custom `SpecReporter` is recommended to be registered as a listener. It takes care of logging on a per-spec basis (i.e. when `it('...')` functions start and end) — which Jest does not do by default.
- The custom `WorkerAssignReporter` prints for every next test suite which device is assigned to its execution.

This is how a typical Jest log output looks when a `streamline-reporter` is set up in `config.json` and
`SpecReporter` added in `e2e/environment.js`:

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
