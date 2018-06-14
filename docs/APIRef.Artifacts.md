---
id: APIRef.Artifacts
title: Artifacts
---

Artifacts are various recordings during tests including, but not limited to, device logs, device screenshots and screen recordings (videos).

## Enabling artifacts

Artifacts are disabled by default. Two things are required to enable them:

1. **Call `detox.beforeEach` and `detox.afterEach` before/after each test**:
	In order for artifacts to work, you have to call `detox.beforeEach(testSummary)` / `detox.afterEach(testSummary)` before / after each test. Their respective signatures are described in [detox object](APIRef.DetoxObjectAPI.md) documentation. As the interface (typing) of `testSummary` may change over the time, and in cases with some test runners it is not trivial to implement test title and status extraction (like with Jest), you are encouraged to use Detox adapter functions like in these examples: [mocha](/examples/demo-react-native/e2e/init.js), [jest](examples/demo-react-native-jest/e2e/init.js).

2. Specify via launch arguments which types of artifacts you want to record:

* To record `.log` files, add `--record-logs all` (or `--record-logs failing`, if you want to keep logs only for failing tests).
* To record `.mp4` test run videos, add `--record-videos all` (or `--record-videos failing`, if you want to keep video recordings only for failing tests).
* To record `.png` screenshots before and after each test, add `--take-screenshots all` (or `--take-screenshots failing`, if you want to keep only screenshots of failing tests).
* To change artifacts root directory location (by default it is `./artifacts`), add `--artifacts-location <path>`.  
**NOTE:** There is a slightly obscure convention. If you want to create automatically a subdirectory with timestamp and configuration name (to avoid file overwrites upon consquent re-runs), specify a path to directory that does not end with a slash. Otherwise, if you want to put artifacts straight to the specified directory (in a case where you make a single run only, e.g. on CI), add a slash (or a backslash) to the end.

```sh
detox test --artifacts-location /tmp/detox_artifacts  # will also append /android.emu.release.2018-06-14 08:54:11Z
detox test --artifacts-location /tmp/detox_artifacts/ # won't append anything, hereby treating it as a root
```

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
