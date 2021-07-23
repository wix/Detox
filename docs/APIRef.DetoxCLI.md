# Detox Command Line Tools (detox-cli)

`detox-cli` lets you operate Detox from command line.

## Installation

Install `detox-cli` globally via [npm](http://npmjs.org/detox-cli):

```sh
npm install -g detox-cli
```

## Usage

```sh
detox <command> [options] 
```

## Commands

| Command | Description |
| --- | --- |
| [init](#init)              | Create initial e2e tests folder for jest or mocha |
| [build](#build)            | **Convenience method.** Run the command defined in 'build' property of the specified configuration. |
| [test](#test)              | Initiating your test suite |
| [run-server](#run-server)  | Starts a standalone detox server |
| [build-framework-cache](#cache) | **MacOS only.** Builds Detox.framework to ~/Library/Detox. The framework cache is specific for each combination of Xcode and Detox versions |
| [clean-framework-cache](#cache) | **MacOS only.** Deletes all compiled framework binaries from ~/Library/Detox, they will be rebuilt on 'npm install' or when running 'build-framework-cache' |
| [rebuild-framework-cache](#cache) | **MacOS only.** Rebuilds the Detox cache |
| [recorder](#recorder) | Starts a [Detox Recorder](https://github.com/wix/DetoxRecorder) recording |

### Options:

| Options | Description |
| --- | --- |
| --version | Show version number |
| --help | Show help |

### init

Scaffolds initial E2E test folder structure for a specific test runner

`detox init -r <test-runner-name>`

| Option                          | Description |
| ---                             | --- |
| -r, --runner <test-runner-name> | test runner name (supported values: mocha, jest) |
| --help                          | Show help |

### build

Run the command defined in `build` property of the specified **configuration**.

`detox build [options]`

| Option | Description |
| --- | --- |
| -c, --configuration \<device config\> | Select a device configuration from your defined configurations, if not supplied, and there's only one configuration, detox will default to it |
| -C, --config-path \<configPath\>      | Specify Detox config file path. If not supplied, detox searches for .detoxrc[.js] or "detox" section in package.json |
| -i, --if-missing                      | Execute the build command only if the app binary is missing. |
| -s, --silent                          | Do not fail with error if an app config has no build command. |
| --help                                | Show help |

### test

Initiating your test suite. <sup>[[1]](#notice-passthrough)</sup>

`detox test [options] <...testFilePaths>`

| Option                                        | Description |
| ---                                           | --- |
| -C, --config-path \<configPath\>              | Specify Detox config file path. If not supplied, detox searches for .detoxrc[.js] or "detox" section in package.json |
| -c, --configuration \<device config\>         | Select a device configuration from your defined configurations, if not supplied, and there's only one configuration, detox will default to it |
| -o, --runner-config \<config\>                | Test runner config file, defaults to 'e2e/mocha.opts' for mocha and 'e2e/config.json' for jest. |
| -n, --device-name [name]                      | Override the device name specified in a configuration. Useful for running a single build configuration on multiple devices. |
| -l, --loglevel [value]                        | Log level: fatal, error, warn, info, verbose, trace |
| -d, --debug-synchronization \<value\>         | Customize how long an action/expectation can take to complete before Detox starts querying the app why it is busy. By default, the app status will be printed if the action takes more than 10s to complete. |
| -a, --artifacts-location \<path\>             | Artifacts (logs, screenshots, etc) root directory.<sup>[[2]](#notice-artifacts)</sup> |
| --record-logs [failing/all/none]              | Save logs during each test to artifacts directory. Pass "failing" to save logs of failing tests only. The default value is **none**. |
| --take-screenshots [manual/failing/all/none]  | Save screenshots before and after each test to artifacts directory. Pass "failing" to save screenshots of failing tests only. The default value is **manual**. |
| --record-videos [failing/all/none]            | Save screen recordings of each test to artifacts directory. Pass "failing" to save recordings of failing tests only. The default value is **none**. |
| --record-performance [all/none]               | [iOS Only] Save Detox Instruments performance recordings of each test to artifacts directory. The default value is **none**. |
| --record-timeline [all/none] | [Jest Only] Record tests and events timeline, for visual display on the [chrome://tracing](chrome://tracing) tool. The default value is **none**. |
| --capture-view-hierarchy [enabled/disabled]   | [iOS Only] Capture `*.uihierarchy` snapshots on view action errors and `device.captureViewHierarchy()` calls. The default value is **disabled**. |
| -R, --retries                                 | [Jest Circus Only] Re-spawn the test runner for individual failing suite files until they pass, or &lt;N&gt; times at least.|
| -r, --reuse                                   | Reuse existing installed app (do not delete + reinstall) for a faster run. |
| -u, --cleanup                                 | Shutdown simulator when test is over, useful for CI scripts, to make sure detox exists cleanly with no residue |
| -w, --workers                                 | Specifies number of workers the test runner should spawn, requires a test runner with parallel execution support (Detox CLI currently supports Jest). *Note: For workers > 1, Jest's spec-level reporting is disabled, by default (can be overridden using --jest-report-specs).* |
| --jest-report-specs | [Jest Only] Whether to output logs per each running spec, in real-time. By default, disabled with multiple workers. |
| -H, --headless                                | [Android Only] Launch Emulator in headless mode. Useful when running on CI. |
| --gpu                                         | [Android Only] Launch Emulator with the specific -gpu [gpu mode] parameter. |
| --device-launch-args | A list of passthrough-arguments to use when (if) devices (Android emulator / iOS simulator) are launched by Detox.<br />**Note: the value must be specified after an equal sign (`=`) and inside quotes.** Usage example:<br />`--device-launch-args="-http-proxy http://1.1.1.1:8000 -no-snapshot-load"` |
| --app-launch-args | Custom arguments to pass (through) onto the app every time it is launched. The same **note** applies here, as for **--device-launch-args**.<br />See [launch arguments guide](APIRef.LaunchArgs.md) for complete info. |
| --no-color                                    | Disable colors in log output |
| --use-custom-logger | Use Detox' custom console-logging implementation, for logging Detox (non-device) logs. Disabling will fallback to node.js / test-runner's implementation (e.g. Jest / Mocha).<br />*Default: true* |
| --force-adb-install | Due to problems with the `adb install` command on Android, Detox resorts to a different scheme for install APK's. Setting true will disable that and force usage of `adb install`, instead.<br/>This flag is temporary until the Detox way proves stable.<br/>*Default: false* |
| --inspect-brk | Uses [node's --inspect-brk](https://nodejs.org/en/docs/guides/debugging-getting-started/#enable-inspector) flag to let users debug the jest/mocha test runner <br />*Default: false* |
| --help                                        | Show help |

#### DETOX_ARGV_OVERRIDE

If you happen to be troubleshooting Detox tests inside a complex script, or a failing CI build
(e.g., on TeamCity or Jenkins), there is an escape-hatch feature for running Detox with
some extra CLI args just by setting the `DETOX_ARGV_OVERRIDE` environment variable before
rerunning it again.

```
> export DETOX_ARGV_OVERRIDE="--forceExit -w 1 --testNamePattern='that hanging test' e2e/sanity/login.test.js"
> bash scripts/ci.e2e.sh
  # ... some output ...
  > detox test -c ios.sim.release -l verbose --workers 3
    # ...
    configuration=ios.sim.release ... jest --maxWorkers 1 --forceExit --testNamePattern='that hanging test' e2e/sanity/login.test.js
```

Consider the example above, where `DETOX_ARGV_OVERRIDE` forces Detox to run Jest in a single worker
mode with a forceful exit (after 1 second) only for a selected test in a specific file.

As you might see, the idea of `DETOX_ARGV_OVERRIDE` is quite similar to [NODE_OPTIONS](https://nodejs.org/api/cli.html#cli_node_options_options)
except for the fact you use it not for regular flows, but for forced ad-hoc patching of a failing Detox configuration to
save your time.

Please avoid using it in your regular flows – instead, use Detox configuration files (`.detoxrc.js`)
as your primary choice.

#### Notices

1. <a name="notice-passthrough">It</a> should be noted that `detox test` is a convenience method to trigger an execution
of a supported test runner, so for the most part it reads configuration from CLI args and `package.json` and remaps it
to command-line arguments or environment variables that are supported by (or not conflict with) the test runner.
Hence, **extra arguments to** `detox test` **will be forwarded to your test runner**, e.g:
  * You run `detox test --bail`, and since `--bail` is an unknown option, it will be forwarded to the test runner as-is.
    * If there is a name conflict for some option (between the test runner and `detox test`), you can pass it explicitly
      after the reserved `--` sequence. For instance, `detox test -- --help`, will pass `--help` to the test runner CLI
      itself.
  
2. <a name="notice-artifacts">If</a> `--artifacts-location` path does not end with a slash (`/`) or a backslash, then detox CLI will append to the
path a subdirectory with configuration name and timestamp (e.g. `artifacts/android.emu.release.2018-06-12 05:52:43Z`).
In other words, the path with a slash at the end assumes you do not want a subdirectory inside.
For more details, please check the [Enabling artifacts](APIRef.Artifacts.md#artifacts).
The default value is **artifacts** (plus a subdir). 

### run-server

Start a standalone Detox server

`detox run-server [options]`

| Option                 | Description                                         |
| --- | --- |
| -p, --port [port]      | Port number (default: 8099) |
| -l, --loglevel [value] | Log level: fatal, error, warn, info, verbose, trace |
| --no-color             | Disable colorful logs |
| --help                 | Show help |

### recorder

If you have installed [Detox Recorder](https://github.com/wix/DetoxRecorder) in your project, you can use this command to start a new recording.

### Cache

Detox stores a cached version of its framework in `~/Library/Detox`. A different cache folder is used for different Xcode and Detox versions. Use the various cache commands to clean or build this cache.
