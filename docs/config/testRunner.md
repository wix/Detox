# Test runner

| Property     | Value    | Description                                                                 |
| ------------ | -------- | --------------------------------------------------------------------------- |
| `testRunner` | `"jest"` | _Required._ Should be `"jest"` for the proper `detox test` CLI functioning. |

A typical Detox configuration in `.detoxrc.js` file looks like:

```json
{
  "runnerConfig": "e2e/config.json",
  "devices": {
    "simulator": {
      "type": "ios.simulator",
      "device": {
        "type": "iPhone 12 Pro Max"
      }
    }
  },
  "apps": {
    "ios.release": {
      "type": "ios.app",
      "binaryPath": "ios/build/Build/Products/Release-iphonesimulator/example.app",
      "build": "<...xcodebuild command...>",
    }
  },
  "configurations": {
    "ios.sim.release": {
      "device": "simulator",
      "app": "ios.release"
    }
  }
}
```

## Jest config

| Property          | Value                             | Description                                                                                                                                                                                                                                                                                                                                                                                  |
| ----------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `maxWorkers`      | `1`                               | _Recommended._ It prevents potential overallocation of mobile devices according to the default logic of Jest (`maxWorkers = cpusCount — 1`) for the default workers count. To override it, [use CLI arguments](../api/detox-cli.md#test), or see [Jest documentation](https://jestjs.io/docs/configuration#maxworkers-number--string) if you plan to change the default value in the config. |
| `testEnvironment` | `"./environment"`                 | _Required._ Needed for the proper functioning of Jest and Detox. See [Jest documentation](https://jestjs.io/docs/en/configuration#testenvironment-string) for more details.                                                                                                                                                                                                                  |
| `testRunner`      | `"jest-circus/runner"`            | _Required._ Needed for the proper functioning of Jest and Detox. See [Jest documentation](https://jestjs.io/docs/en/configuration#testrunner-string) for more details.                                                                                                                                                                                                                       |
| `testTimeout`     | `120000`                          | _Required_. Overrides the default timeout (5 seconds), which is usually too short to complete a single end-to-end test.                                                                                                                                                                                                                                                                      |
| `reporters`       | `["detox/runners/jest/reporter"]` | _Recommended._ Sets up our streamline replacement for [Jest’s default reporter](https://jestjs.io/docs/en/configuration#reporters-array-modulename-modulename-options), which removes Jest’s default buffering of `console.log()` output. That is helpful for end-to-end tests since log messages appear on the screen without any artificial delays.                                        |
| `verbose`         | `true`                            | _Conditional._ Must be `true` if above you have replaced Jest’s default reporter with Detox’s `reporter`. Optional otherwise.                                                                                                                                                                                                                                                                |

A typical `jest-circus` configuration in `e2e/config.json` file would look like:

```json
{
  "testRunner": "jest-circus/runner",
  "testEnvironment": "./environment",
  "testTimeout": 120000,
  "reporters": ["detox/runners/jest/reporter"],
  "verbose": true
}
```

**Notes:**

- The custom `SpecReporter` is recommended to be registered as a listener. It takes care of logging on a per-spec basis (i.e. when `it('...')` functions start and end) — which Jest does not do by default.
- The custom `WorkerAssignReporter` prints for every next test suite which device is assigned to its execution.

This is how a typical Jest log output looks when `SpecReporter` and `WorkerAssignReporter` are enabled in `streamline-reporter` is set up in `config.json` and
`SpecReporter` added in `e2e/environment.js`:

![Streamlined output](../img/jest-guide/streamlined_logging.png)

### Writing Tests

There are some things you should notice:

- Don’t worry about mocks being used, Detox works on the compiled version of your app.
- Detox exposes its primitives (`expect`, `device`, ...) globally, it will override Jest’s global `expect` object.
- use `import jestExpect from 'expect'` if you need.

### Parallel Test Execution

Through Detox' CLI, Jest can be started with [multiple workers](../Guide.ParallelTestExecution.md) that run tests simultaneously, e.g.:

```bash
detox test --configuration <yourConfigurationName> --maxWorkers 2
```

In this mode, Jest effectively assigns one worker per each test file.
Per-spec logging offered by the `SpecReporter` mentioned earlier, does not necessarily make sense, as the workers' outputs get mixed up.

By default, we disable `SpecReporter` in a multi-workers environment.
If you wish to force-enable it nonetheless, the [`--jest-report-specs`](../api/detox-cli.md#test) CLI option can be used with `detox test`, e.g.:

```bash
detox test --configuration <yourConfigurationName> --maxWorkers 2 --jest-report-specs
```

### How to Run Unit and E2E Tests in the Same Project

- Create different Jest configs for unit and E2E tests, e.g. in `e2e/config.json` (for Detox) and `jest.config.js`
  (for unit tests). For example, in Jest’s E2E config you can set `testMatch` to look for `<rootDir>/e2e/**/*.test.js$`
  glob, and this way avoid accidental triggering of unit tests in your `src/` or `lib/` folder.
- To run your E2E tests, use `detox test` command (or `npx detox test`, if you haven’t installed `detox-cli`).
