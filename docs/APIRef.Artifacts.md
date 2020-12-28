# Artifacts

Artifacts are various recordings during tests including, but not limited to, device logs, device screenshots and screen recordings (videos).

## Enabling Artifacts

Artifacts are disabled by default. To enable them, specify via **launch arguments** or a **configuration** object what artifacts you want to record.

### Launch Arguments

* To record `.log` files, add `--record-logs all` (or `--record-logs failing`, if you want to keep logs only for failing tests).
* To record `.mp4` test run videos, add `--record-videos all` (or `--record-videos failing`, if you want to keep video recordings only for failing tests).
* To record `.dtxrec` (Detox Instruments recordings) for each test, add `--record-performance all`. To open those recordings, you'll need [Detox Instruments](https://github.com/wix/DetoxInstruments). **NOTE:** only iOS is supported.
* To capture `.uihierarchy` snapshots (**iOS only, Xcode 12.0+**) on view action failures, add `--capture-view-hierarchy enabled`.
* To take `.png` screenshots before and after each test, add `--take-screenshots all` (or `--take-screenshots failing`, if you want to keep only screenshots of failing tests).  
Alternatively, you might leverage the [device.takeScreenshot()](APIRef.DeviceObjectAPI.md#devicetakescreenshotname) API for manual control.

* To change artifacts root directory location (by default it is `./artifacts`), add `--artifacts-location <path>`.  
**NOTE:** <a id="slash-convention">There</a> is a slightly obscure convention. If you want to create automatically a subdirectory with timestamp and configuration name (to avoid file overwrites upon consequent reruns), specify a path to directory that does not end with a slash. Otherwise, if you want to put artifacts straight to the specified directory (in a case where you make a single run only, e.g. on CI), add a slash (or a backslash) to the end.

```sh
detox test --artifacts-location /tmp/detox_artifacts  # will also append /android.emu.release.2018-06-14 08:54:11Z
detox test --artifacts-location /tmp/detox_artifacts/ # won't append anything, hereby treating it as a root
```

### Configuration Object

Detox artifacts can be configured in a more advanced way with the `artifacts` configuration in `package.json` (or `.detoxrc`):

```json
{
  "artifacts": {},
  "configurations": {
    "some.device": {
      "artifacts": {},
    },
  },
}
```

**NOTE:** As you can see, there is a global and a local (per-configuration) configuration of the artifacts.
Detox merges those configurations, and the per-device artifacts configuration has a higher priority over the general one.

The `artifacts` object has the following properties:

| Property    | Example values                  | Default value | Description |
|-------------|---------------------------------|---------------|-------------|
| rootDir     | `".artifacts/"`                 | `./artifacts` | A directory, where all the recorded artifacts will be placed in. Please note that there is a trailing slash convention [described above](#slash-convention). |
| pathBuilder | `"./e2e/config/pathbuilder.js"` | `undefined`   | Path to a module that exports a custom `PathBuilder` [<sup>\[a\]</sup>](#pathBuilder) |
| plugins     | `{ ... }`                       | ... see below | ... see below |

<a id=pathBuilder><sup>a</sup><code>PathBuilder</code></a> should be either an _object_ with a method `buildPathForTestArtifact` or a _class_ &mdash; see the corresponding interfaces below:

```typescript
interface PathBuilder {
    buildPathForTestArtifact(artifactPath: string, testSummary?: TestSummary): string;
}

interface PathBuilderClass {
    new(opts: { rootDir: string; }): PathBuilder;
}
```

As one can see, if a custom implementation of `PathBuilder` exports a class instead of an object, then the class constructor can also get and save `rootDir` location:

```js
class MyPathBuilder {
  constructor({ rootDir }) {
    this._rootDir = rootDir;
  }

  buildPathForTestArtifact(artifactName, testSummary) {
    /* ... use this._rootDir ... */
  }
}

module.exports = MyPathBuilder;
```

Its main method, `buildPathForTestArtifact` should return a full path to the custom artifact location, when called with a suggested artifact name (e.g., `testDone.png`, `device.log`) and the current `TestSummary`, where `TestSummary` is:

```typescript
interface TestSummary {
    /**
     * Name of the current test, e.g., for:
     * describe('that screen', () =>
     *   it('should have a menu', () =>
     * The expected string would be: "should have a menu".
     */
    title: string;
    /**
     * Full name of the current test, usually preceeded by a suite name, e.g.:
     * describe('that screen', () =>
     *   it('should have a menu', () =>
     * The expected string would be: "that screen should have a menu".
     */
    fullName: string;
    /**
     * Status of the current test. Free-form strings are not allowed.
     */
    status: 'running' | 'passed' | 'failed';
    /**
     * Clarifies the reason for why the test has failed.
     * Expected to coincide only with status: 'failed'.
     */
    timedOut?: boolean;
    /**
     * If the test runner is capable of retrying failed tests, then
     * this property indicates for which time this test is running.
     * When the property is undefined, its value is considered to be 1.
     * */
    invocations?: number;
}
```

For more technical details, search for `ArtifactPathBuilder.js` in Detox source code.

The further subsections describe the `plugins` object structure.

#### Screenshot Plugin

Below is a default screenshot plugin object configuration, which is loaded implicitly and corresponds to the `manual` preset:

```json
{
  "plugins": {
    "screenshot": {
      "enabled": true,
      "shouldTakeAutomaticSnapshots": false,
      "keepOnlyFailedTestsArtifacts": false,
      "takeWhen": {
        "testStart": true,
	"testDone": true,
	"appNotReady": true,
      },
    }
  }
}
```

The other string presets override the following properties compared to the default configuration:

* `none` => `{ enabled: false }`.
* `failing` => `{ shouldTakeAutomaticSnapshots: true, keepOnlyFailedTestsArtifacts: true }`.
* `all` => `{ shouldTakeAutomaticSnapshots: true, keepOnlyFailedTestsArtifacts: false }`

The invidual property behavior is the following:

* If `enabled` is _false_, then the screenshots will never be saved to the artifacts folder.
* If `shouldTakeAutomaticSnapshots` is _false_, then no one of the events described in `takeWhen` object is going to trigger a screenshot.
* If `keepOnlyFailedTestsArtifacts` is _true_, then only screenshots from a failed test will be saved to the artifacts folder.
* If `takeWhen` is _undefined_, it is going to have the default value described above (all props are true).
* If `takeWhen` is set to be an empty object `{}`, that is equivalent to:

```json
{
  "testStart": false,
  "testDone": false,
  "appNotReady": true,
}
```

Hence, for example, if you wish to enable only `testDone` screenshots and leave taking `appNotReady` screenshots as-is, you have to pass:

```json
{
  "artifacts": {
    "plugins": {
      "screenshot": {
        "takeWhen": { "testDone": true }
      }
    }
  }
}
```

#### Video Plugin

To be done. See meanwhile the example in [APIRef.Configuration.md#artifacts-configuration](APIRef.Configuration.md#artifacts-configuration).

#### Log Plugin

To be done. See meanwhile the example in [APIRef.Configuration.md#artifacts-configuration](APIRef.Configuration.md#artifacts-configuration).

#### Instruments Plugin

To be done. See meanwhile the example in [APIRef.Configuration.md#artifacts-configuration](APIRef.Configuration.md#artifacts-configuration).

#### UI hierarchy Plugin

To be done. See meanwhile the example in [APIRef.Configuration.md#artifacts-configuration](APIRef.Configuration.md#artifacts-configuration).

#### Timeline Plugin

When enabled using the `--record-timeline all` argument to Detox, the time-line of the entire testing session is recorded, based on trace calls made by Detox internally, and explicit calls made in user test-code, combined.
The final outcome is a JSON-like file named `detox.trace.json`, which, if loaded into a Chrome-browser tab with the `chrome://tracing` URL, would look something like this:

![Timeline artifact example](img/timeline-artifact.png)

This _tracing_ view provides a visual, hiererchial representation of the of the various processes that took place during the execution of the testing session, over the execution's *time-line*. These processes appear as hiererchial _sections_ -- sometimes visually ordered in a parent-child way, depending on their formation time and context.
To name a few predefined events, which are generated by Detox itself:

- **`detoxInit`:** Initialization of Detox, prior to running the suites associated with a specific tests file.
- **`awaitBoot`:** Waiting for an emulator to complete booting (thus being ready to run tests). Done in the surrounding context of `detoxInit` (and hence visually appears "below" it), as waiting for emulators' boot is an inherent part of Detox' initiailization.
- **`appInstall`**, **`appUninstall`**.
- **"Sanity":** Execution of a user test suite called _Sanity_.
- **`reloadRN`:** A dynamic reload of the React-Native. Bound to calls to `device.reloadReactNative()`, specifically.

In the above example, the following can be observed:

1. There were 2 test workers (the Worker #1, Worker #2 time-lines) executing a total of two test suites.
2. There were 2 Android emulators used for running the test session, namely `emulator-17800` and `emulator-12466`. They were used by worker 1 and worker 2, respectively.
3. It took about a total of 54 seconds to intialize and run all the tests.
4. The first worker took longer to initialize (as depicted by the `detoxInit` section). In particular, that happened because it took longer for the associated emulator too finish bootstrapping (see the child `awaitBoot` section). That suggests there might be a problem with the test execution environment.

##### Purpose

**This artifact can be helpful in looking up ways to optimize the execution of your e2e tests.** It may surface shortcomings in the test environment's ability to run the test, or provide a means to consider different ways of splitting up your tests over test files so as to better utilize parallelism.

The artifact can in fact be even better utilized -- to the level of inspecing the inside of your tests, by explicitly calling `trace` via the `detox.traceCall()` and `detox.trace.startSection()`, `detox.trace.endSection()` [API's](APIRef.DetoxObjectAPI.md#detoxtracecall) inside your tests.

## Artifacts Structure

1. **Artifacts root folder** is created per detox test run. If, for instance,`--artifacts-location /tmp` is used with `--configuration ios.sim.release` configuration on 14th June 2018 at 11:02:11 GMT+02, then the folder `/tmp/ios.sim.release.2018-06-14 09:02:11Z` is created.

2. **Test folder** is created per test inside the root folder. The folder name consists of the test number, and the test's full name provided to `detox.afterEach(testSummary)` as explained above and in [detox object](APIRef.DetoxObjectAPI.md) documentation. For instance, for the above example, the following folders will be created inside `/tmp/ios.sim.release.2018-06-14 09:02:11Z`:

```
✗ Assertions should assert an element has (accessibility)
✓ Network Synchronization Sync with short network requests - 100ms
```

3. **Artifacts files** are created inside the test folders. The files suffixes stand for the files types (currently there are .err.log and .out.log), and the files prefixes are the launch numbers of the application per test (if the app was executed more than once per test, you will have several artifacts of each type - one per launch). For instance, a test folder may contain the following artifacts files:

```
test.log
test.mp4
test.dtxrec/
beforeEach.png
afterEach.png
```

##### Example of the structure:

```
artifacts/android.emu.release.2018-06-12 06:36:18Z/startup.log
artifacts/android.emu.release.2018-06-12 06:36:18Z/✗ Assertions should assert an element has (accessibility) id/beforeEach.png
artifacts/android.emu.release.2018-06-12 06:36:18Z/✗ Assertions should assert an element has (accessibility) id/test.log
artifacts/android.emu.release.2018-06-12 06:36:18Z/✗ Assertions should assert an element has (accessibility) id/test.mp4
artifacts/android.emu.release.2018-06-12 06:36:18Z/✗ Assertions should assert an element has (accessibility) id/afterEach.png
```

## Troubleshooting

### Screenshots and Videos Do Not Appear in the Artifacts Folder

Make sure you have `detox.beforeEach(testSummary)` and `detox.afterEach(testSummary)` calls in your `./e2e/init.js`. Check out the recommendations on how to do that for [mocha](/examples/demo-react-native/e2e/init.js) and [jest](/examples/demo-react-native-jest/e2e/init.js) using the out-of-the-box adapters.

### Video Recording Issues on CI

For iOS, you might be getting errors on CI similar to this:

```
Error: Error Domain=NSPOSIXErrorDomain Code=22 "Invalid argument" UserInfo={NSLocalizedDescription=Video recording requires hardware Metal capability.}.
```

Unfortunately, this error is beyond our reach. To fix it, you have to enable hardware acceleration on your build machine, or just disable video recording on CI if it is not possible to turn on the acceleration.

There might be a similar issue on Android when the screenrecording process exits with an error on CI. While the solution might be identical to the one above, also you might try to experiment with other emulator devices and Android OS versions to see if it helps.

### Detox Instruments is Installed in a Custom Location

If you have to use [Detox Instruments](https://github.com/wix/DetoxInstruments) installed in a custom location, you can point Detox to it with the `DETOX_INSTRUMENTS_PATH` environment variable, as shown below:

```bash
DETOX_INSTRUMENTS_PATH="/path/to/Detox Instruments.app" detox test ...
```

> **Note:** If **Detox Instruments** had been [integrated into your project](https://github.com/wix/DetoxInstruments/blob/master/Documentation/XcodeIntegrationGuide.md), then the integrated [Detox Profiler framework](https://github.com/wix/DetoxInstruments/tree/master/Profiler) will be used when profiling with Detox.

### Ctrl+C Does Not Clean Up Temporary Files

This is a known issue. 🤷‍♂️
After you press Ctrl+C and stop the tests, some of temporary files won't get erased (e.g. `/sdcard/83541_0.mp4` on Android emulator, or `/private/var/folders/lm/thz8hdxs4v3fppjh0fjc2twhfl_3x2/T/f12a4fcb-0d1f-4d98-866c-e7cea4942ade.png` on your Mac).
It cannot be solved on behalf of Detox itself, because the problem has to do with how Jest runner terminates its puppet processes.
The issue is on our radar, but the ETA for the fix stays unknown.
If you feel able to contribute the fix to [Jest](https://github.com/facebook/jest), you are very welcome.
