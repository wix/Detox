# Artifacts

Artifacts are various recordings during tests including, but not limited to, device logs, device screenshots and screen recordings (videos).

## Enabling artifacts

Artifacts are disabled by default. Two things are required to enable them:

1. **Call `detox.beforeEach` and `detox.afterEach` before/after each test**:
	In order for artifacts to work, you have to call `detox.beforeEach(testSummary)` / `detox.afterEach(testSummary)` before / after each test. Their respective signatures are described in [detox object](APIRef.DetoxObjectAPI.md) documentation. As the interface (typing) of `testSummary` may change over the time, and in cases with some test runners it is not trivial to implement test title and status extraction (like with Jest), you are encouraged to use Detox adapter functions like in these examples: [mocha](/examples/demo-react-native/e2e/init.js), [jest](/examples/demo-react-native-jest/e2e/init.js).

2. Specify via launch arguments or a configuration object what artifacts you want to record.

### Launch arguments

* To record `.log` files, add `--record-logs all` (or `--record-logs failing`, if you want to keep logs only for failing tests).
* To record `.mp4` test run videos, add `--record-videos all` (or `--record-videos failing`, if you want to keep video recordings only for failing tests).
* To record `.dtxrec` (Detox Instruments recordings) for each test, add `--record-performance all`. To open those recordings, you'll need [Detox Instruments](https://github.com/wix/DetoxInstruments). **NOTE:** only iOS is supported.
* To take `.png` screenshots before and after each test, add `--take-screenshots all` (or `--take-screenshots failing`, if you want to keep only screenshots of failing tests).  
Alternatively, you might leverage the [device.takeScreenshot()](APIRef.DeviceObjectAPI.md#devicetakescreenshotname) API for manual control.

* To change artifacts root directory location (by default it is `./artifacts`), add `--artifacts-location <path>`.  
**NOTE:** <a id="slash-convention">There</a> is a slightly obscure convention. If you want to create automatically a subdirectory with timestamp and configuration name (to avoid file overwrites upon consquent re-runs), specify a path to directory that does not end with a slash. Otherwise, if you want to put artifacts straight to the specified directory (in a case where you make a single run only, e.g. on CI), add a slash (or a backslash) to the end.

```sh
detox test --artifacts-location /tmp/detox_artifacts  # will also append /android.emu.release.2018-06-14 08:54:11Z
detox test --artifacts-location /tmp/detox_artifacts/ # won't append anything, hereby treating it as a root
```

### Configuration object

Detox artifacts can be configured in a more advanced way with the `artifacts` configuration in `package.json`:

```json
{
  "detox": {
    "artifacts": {},
    "configurations": {
      "some.device": {
        "artifacts": {},
      },
    },
  }
}
```

**NOTE:** Detox merges artifact configurations from `package.json`, and the per-device artifacts configuration has a higher priority over the general one.

The `artifacts` object has the following properties:

| Property    | Example values                  | Default value | Description |
|-------------|---------------------------------|---------------|-------------|
| rootDir     | `".artifacts/"`                 | `./artifacts` | A directory, where all the recorded artifacts will be placed in. Please note that there is a trailing slash convention [described above](#slash-convention). |
| pathBuilder | `"./e2e/config/pathbuilder.js"` | `undefined`   | Path to a module that implements `PathBuilder` interface[<sup>\[a\]</sup>](#pathBuilder) |
| plugins     | `{ ... }`                       | ... see below | ... see below |

<a id=pathBuilder><sup>a</sup> PathBuilder</a> should be an object with a method `buildPathForTestArtifact` or a class. The `buildPathForTestArtifact` method has a signature: `(artifactName: string, testSummary?: { title: string; fullName: string; status: 'running' | 'passed' | 'failed' }) => string`, where it accepts a suggested artifact name (e.g., `testDone.png`, `device.log`), a current test summary with its name and status, and it is expected to return a full path to the custom artifact location. If it is a class, its constructor also accepts `{ rootDir }` configuration object. Search for `ArtifactPathBuilder.js` in Detox source code for a technical reference.

The further subsections describe the `plugins` object structure.

#### Screenshot plugin

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
* `all` => `{ shouldTakeAutomaticSnapshots: true, keepOnlyFailedTestsArtifacts: true }`

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

#### Video plugin

To be done. See meanwhile the example in [APIRef.Configuration.md#artifacts-configuration](APIRef.Configuration.md#artifacts-configuration).

#### Log plugin

To be done. See meanwhile the example in [APIRef.Configuration.md#artifacts-configuration](APIRef.Configuration.md#artifacts-configuration).

#### Instruments plugin

To be done. See meanwhile the example in [APIRef.Configuration.md#artifacts-configuration](APIRef.Configuration.md#artifacts-configuration).

## Artifacts structure

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

### Screenshots and videos do not appear in the artifacts folder

Make sure you have `detox.beforeEach(testSummary)` and `detox.afterEach(testSummary)` calls in your `./e2e/init.js`. Check out the recommendations on how to do that for [mocha](/examples/demo-react-native/e2e/init.js) and [jest](/examples/demo-react-native-jest/e2e/init.js) using the out-of-the-box adapters.

### Video recording issues on CI

For iOS, you might be getting errors on CI similar to this:

```
Error: Error Domain=NSPOSIXErrorDomain Code=22 "Invalid argument" UserInfo={NSLocalizedDescription=Video recording requires hardware Metal capability.}.
```

Unfortunately, this error is beyond our reach. To fix it, you have to enable hardware acceleration on your build machine, or just disable video recording on CI if it is not possible to turn on the acceleration.

There might be a similar issue on Android when the screenrecording process exits with an error on CI. While the solution might be identical to the one above, also you might try to experiment with other emulator devices and Android OS versions to see if it helps.

### Detox Instruments is installed in a custom location

If you have to use [Detox Instruments](https://github.com/wix/DetoxInstruments)
installed in a custom location (e.g., inside `node_modules`), you can point Detox
to it with the `DETOX_INSTRUMENTS_PATH` environment variable, as shown below:

```bash
DETOX_INSTRUMENTS_PATH="/path/to/Detox Instruments.app" detox test ...
```

Please mind that if **Detox Instruments** had been [integrated into
your app](https://github.com/wix/DetoxInstruments/blob/master/Documentation/XcodeIntegrationGuide.md) (usually, that is in development builds), then the built-in version of [Detox Profiler framework](https://github.com/wix/DetoxInstruments/tree/master/Profiler) will always take priority over any custom path to Detox Instruments installation.


### Ctrl+C does not terminate Detox+Jest tests correctly

This is a known issue.
Video or log recording process under Detox+Jest is apt to keep running even after you press Ctrl+C and stop the tests.
Furthermore, some of temporary files won't get erased (e.g. `/sdcard/83541_0.mp4` on Android emulator, or `/private/var/folders/lm/thz8hdxs4v3fppjh0fjc2twhfl_3x2/T/f12a4fcb-0d1f-4d98-866c-e7cea4942ade.png` on your Mac).
It cannot be solved on behalf of Detox itself, because the problem has to do with how Jest runner works with its puppet processes.
The issue is on our radar, but the ETA for the fix stays unknown.
If you feel able to contribute the fix to [Jest](https://github.com/facebook/jest), you are very welcome.
