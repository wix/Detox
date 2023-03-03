# detox test

```bash
detox test [options] <...testFilePaths>
```

For the most part, `detox test` is a convenience method which converts CLI arguments to environment variables and
runs a third-party test runner one or multiple times (if `--retries` configured). All unknown flags are just
forwarded as-is to the test runner underneath, e.g.:

```plain text
detox test -c ios.debug --showConfig
```

gets translated to:

```plain text
DETOX_CONFIGURATION=ios.debug jest --showConfig
```

You can freely take the CLI command it prints and run it independently, without the help of Detox CLI.

If there is a name conflict for some option (both the test runner and `detox test` have a CLI argument with the same
name), you can pass it explicitly after the reserved `--` sequence:

```plain text
detox test -c ios.debug -- --help
↓
DETOX_CONFIGURATION=ios.debug jest --help
```

## Options

| Option                                        | Description                                                                                                                                                                                                                                                                                             |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| -C, --config-path `<configPath>`              | Specify Detox config file path. If not supplied, detox searches for .detoxrc\[.js] or "detox" section in package.json                                                                                                                                                                                   |
| -c, --configuration `<device config>`         | Select a device configuration from your defined configurations, if not supplied, and there’s only one configuration, detox will default to it                                                                                                                                                           |
| -n, --device-name \[name]                     | Override the device name specified in a configuration. Useful for running a single build configuration on multiple devices.                                                                                                                                                                             |
| -l, --loglevel \[value]                       | Log level: fatal, error, warn, info, verbose, trace                                                                                                                                                                                                                                                     |
| -d, --debug-synchronization `<value>`         | Customize how long an action/expectation can take to complete before Detox starts querying the app why it is busy. By default, the app status will be printed if the action takes more than 10s to complete.                                                                                            |
| -a, --artifacts-location `<path>`             | Artifacts (logs, screenshots, etc) root directory.[^1]                                                                                                                                                                                                                                                  |
| --record-logs \[failing/all/none]             | Save logs during each test to artifacts directory. Pass "failing" to save logs of failing tests only. The default value is **none**.                                                                                                                                                                    |
| --take-screenshots \[manual/failing/all/none] | Save screenshots before and after each test to artifacts directory. Pass "failing" to save screenshots of failing tests only. The default value is **manual**.                                                                                                                                          |
| --record-videos \[failing/all/none]           | Save screen recordings of each test to artifacts directory. Pass "failing" to save recordings of failing tests only. The default value is **none**.                                                                                                                                                     |
| --record-performance \[all/none]              | \[iOS Only] Save Detox Instruments performance recordings of each test to artifacts directory. The default value is **none**.                                                                                                                                                                           |
| --capture-view-hierarchy \[enabled/disabled]  | \[iOS Only] Capture `*.uihierarchy` snapshots on view action errors and `device.captureViewHierarchy()` calls. The default value is **disabled**.                                                                                                                                                       |
| -R, --retries                                 | Re-spawn the test runner for individual failing suite files until they pass, or `<N>` times at most.                                                                                                                                                                                                    |
| -r, --reuse                                   | Reuse existing installed app (do not delete + reinstall) for a faster run.                                                                                                                                                                                                                              |
| -u, --cleanup                                 | Shutdown simulator when test is over, useful for CI scripts, to make sure detox exists cleanly with no residue                                                                                                                                                                                          |
| --jest-report-specs                           | \[Jest Only] Whether to output logs per each running spec, in real-time. By default, disabled with multiple workers.                                                                                                                                                                                    |
| -H, --headless                                | Launch device in headless mode. Useful when running on CI.                                                                                                                                                                                                                                              |
| --device-boot-args                            | A list of passthrough-arguments to use when (if) devices (Android emulator / iOS simulator) are launched by Detox.<br />**Note: the value must be specified after an equal sign (`=`) and inside quotes.** Usage example:<br />`--device-boot-args="-http-proxy http://1.1.1.1:8000 -no-snapshot-load"` |
| --app-launch-args                             | Custom arguments to pass (through) onto the app every time it is launched. The same **note** applies here, as for **--device-boot-args**.<br />See [launch arguments guide](../guide/launch-args.md) for complete info.                                                                                 |
| --start                                       | Control execution of "start" commands in the app configs. By default, they run right before the test runner. Pass `--start=force` to ignore the errors coming from the "start" commands, and run the test runner anyway. Pass `--no-start` to skip the "start" commands altogether.                     |
| --no-color                                    | Disable colors in log output                                                                                                                                                                                                                                                                            |
| --use-custom-logger                           | Use Detox' custom console-logging implementation, for logging Detox (non-device) logs. Disabling will fallback to node.js / test runner’s implementation (e.g. Jest).<br />_Default: true_                                                                                                              |
| --gpu                                         | \[Android Only] Launch Emulator with the specific -gpu \[gpu mode] parameter.                                                                                                                                                                                                                           |
| --force-adb-install                           | \[Android Only] Due to problems with the `adb install` command on Android, Detox resorts to a different scheme for installing APKs. Setting true will disable that and force usage of `adb install`, instead.<br/>This flag is temporary until the Detox way proves stable.<br/>_Default: false_        |
| --inspect-brk                                 | Uses [node’s --inspect-brk](https://nodejs.org/en/docs/guides/debugging-getting-started/#enable-inspector) flag to let users debug the test runner <br />_Default: false_                                                                                                                               |
| --help                                        | Show help                                                                                                                                                                                                                                                                                               |

## `DETOX_ARGV_OVERRIDE`

If you happen to be troubleshooting Detox tests inside a complex script, or a failing CI build
(e.g., on TeamCity or Jenkins), there is an escape-hatch feature for running Detox with
some extra CLI args just by setting the `DETOX_ARGV_OVERRIDE` environment variable before
rerunning it again.

```plain text
> export DETOX_ARGV_OVERRIDE="--forceExit -w 1 --testNamePattern='that hanging test' e2e/sanity/login.test.js"
> bash scripts/ci.e2e.sh
  # ... some output ...
  > detox test -c ios.sim.release -l verbose --maxWorkers 3
    # ...
    configuration=ios.sim.release ... jest --maxWorkers 1 --forceExit --testNamePattern='that hanging test' e2e/sanity/login.test.js
```

Consider the example above, where `DETOX_ARGV_OVERRIDE` forces Detox to run Jest in a single worker
mode with a forceful exit (after 1 second) only for a selected test in a specific file.

As you might see, the idea of `DETOX_ARGV_OVERRIDE` is quite similar to [NODE\_OPTIONS](https://nodejs.org/api/cli.html#cli_node_options_options)
except for the fact you use it not for regular flows, but for forced ad-hoc patching of a failing Detox configuration to
save your time.

Please avoid using it in your regular flows – instead, use Detox configuration files (`.detoxrc.js`)
as your primary choice.

[^1]: If `--artifacts-location` path does not end with a slash (`/`) or a backslash, then detox CLI will append to the
    path a subdirectory with configuration name and timestamp (e.g. `artifacts/android.emu.release.2018-06-12 05:52:43Z`).
    In other words, the path with a slash at the end assumes you do not want a subdirectory inside.
    For more details, please check the [Enabling artifacts](../config/artifacts.mdx#artifacts).
    The default value is **artifacts** (plus a subdirectory).
