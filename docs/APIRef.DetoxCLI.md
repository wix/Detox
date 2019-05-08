---
id: APIRef.DetoxCLI
title: Detox Command Line Tools (detox-cli)
---

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
| clean-framework-cache      | **MacOS only.** Delete all compiled framework binaries from ~/Library/Detox, they will be rebuilt on 'npm install' or when running 'build-framework-cache'
| build-framework-cache      | **MacOS only.** Build Detox.framework to ~/Library/Detox. The framework cache is specific for each combination of Xcode and Detox versions

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
| -c, --configuration \<device config\> |  Select a device configuration from your defined configurations, if not supplied, and there's only one configuration, detox will default to it |
| --help                                | Show help |

### test

Initiating your test suite. <sup>[[1]](#notice-passthrough)</sup>

`detox test [options] <...testFilePaths>`

| Option                                        | Description |
| ---                                           | --- |
| -c, --configuration \<device config\>         | Select a device configuration from your defined configurations, if not supplied, and there's only one configuration, detox will default to it |
| -o, --runner-config \<config\>                | Test runner config file, defaults to 'e2e/mocha.opts' for mocha and 'e2e/config.json' for jest. |
| -n, --device-name [name]                      | Override the device name specified in a configuration. Useful for running a single build configuration on multiple devices. |
| -l, --loglevel [value]                        | Log level: fatal, error, warn, info, verbose, trace |
| -d, --debug-synchronization \<value\>         | When an action/expectation takes a significant amount time use this option to print device synchronization status. The status will be printed if the action takes more than [value]ms to complete |
| -a, --artifacts-location \<path\>             | Artifacts (logs, screenshots, etc) root directory.<sup>[[2]](#notice-artifacts)</sup> |
| --record-logs [failing/all/none]              | Save logs during each test to artifacts directory. Pass "failing" to save logs of failing tests only. The default value is **none**. |
| --take-screenshots [manual/failing/all/none]  | Save screenshots before and after each test to artifacts directory. Pass "failing" to save screenshots of failing tests only. The default value is **manual**. |
| --record-videos [failing/all/none]            | Save screen recordings of each test to artifacts directory. Pass "failing" to save recordings of failing tests only. The default value is **none**. |
| --record-performance [all/none]               | [iOS Only] Save Detox Instruments performance recordings of each test to artifacts directory. The default value is **none**. |
| -r, --reuse                                   | Reuse existing installed app (do not delete + reinstall) for a faster run. |
| -u, --cleanup                                 | Shutdown simulator when test is over, useful for CI scripts, to make sure detox exists cleanly with no residue |
| -w, --workers                                 | [iOS Only] Specifies number of workers the test runner should spawn, requires a test runner with parallel execution support (Detox CLI currently supports Jest). *Note: For workers > 1, Jest's spec-level reporting is disabled, by default (can be overridden using --jest-report-specs).* |
| --jest-report-specs | [Jest Only] Whether to output logs per each running spec, in real-time. By default, disabled with multiple workers. |
| -H, --headless                                | [Android Only] Launch Emulator in headless mode. Useful when running on CI. |
| --gpu                                         | [Android Only] Launch Emulator with the specific -gpu [gpu mode] parameter. |
| --no-color                                    | Disable colors in log output |
| --help                                        | Show help |

##### Notices

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



