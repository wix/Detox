---
id: APIRef.DetoxCLI
title: Detox Command Line Tools (detox-cli)
---

`detox-cli` lets you operate Detox from command line.

## Installation
Install `detox-cli` globally via npm:

```sh
npm install -g detox-cli
```

## Usage
```sh
detox [options] [command]
```

## Commands:
| Command | Description |
| --- | --- |
| [test](#test)              | Initiating your test suite |
| [build](#build)            | Run the command defined in `configuration.build` |
| [run-server](#run-server)  | Starts a standalone detox server |
| [init](#init)              | Create initial e2e tests folder for jest or mocha |
| clean-framework-cache      | Delete all compiled framework binaries from ~/Library/Detox, they will be rebuilt on 'npm install' or when running 'build-framework-cache'
| build-framework-cache      | Build Detox.framework to ~/Library/Detox. The framework cache is specific for each combination of Xcode and Detox versions
| [help](#help)              | Display help for specific command |

## Options:

| Options | Description |
| --- | --- |
| -h, --help | Output usage information |


## Commands

### test
Initiating your test suite

`detox test [options]`

| Option                                        | Description |
| ---                                           | --- |
| -h, --help                                    | output usage information |
| -o, --runner-config \<config\>                | Test runner config file, defaults to 'e2e/mocha.opts' for mocha and 'e2e/config.json' for jest. Overrides the equivalent configuration in `package.json`, if set. |
| -s, --specs \<relativePath\>                  | Root of tests look-up folder. Overrides the equivalent configuration in `package.json`, if set. |
| -l, --loglevel [value]                        | Log level: fatal, error, warn, info, verbose, trace |
| --no-color                                    | Disable colors in log output |
| -c, -configuration \<device config\>          | Select a device configuration from your defined configurations,if not supplied, and there's only one configuration, detox will default to it |
| -r, --reuse                                   | Reuse existing installed app (do not delete and re-tall) for a faster run. |
| -u, --cleanup                                 | Shutdown simulator when test is over, useful for CI ipts, to make sure detox exists cleanly with no residue |
| -d, --debug-synchronization \<value\>         | When an action/expectation takes a significant amount time use this option to print device synchronization status. The status will be printed if the ion takes more than [value]ms to complete |
| -a, --artifacts-location \<path\>             | Artifacts (logs, screenshots, etc) root directory. If it does not end with a slash (`/`) or backslash, then CLI will append to the path a subdirectory with configuration name and timestamp (e.g. `artifacts/android.emu.release.2018-06-12 05:52:43Z`. The path with a slash at the end assumes you do not want a subdirectory inside. For more details, please check the [Enabling artifacts](APIRef.Artifacts.md#artifacts). The default value is **artifacts** (plus a subdir). |
| --record-logs [failing/all/none]              | Save logs during each test to artifacts directory. Pass "failing" to save logs of failing tests only. The default value is **none**. |
| --take-screenshots [failing/all/none]         | Save screenshots before and after each test to artifacts directory. Pass "failing" to save screenshots of failing tests only. The default value is **none**. |
| --record-videos [failing/all/none]            | Save screen recordings of each test to artifacts directory. Pass "failing" to save recordings of failing tests only. The default value is **none**. |
| -p, --platform [ios/android]                  | Run platform specific tests. Runs tests with invert grep on `:platform:`, e.g test with substring `:ios:` in its name will not run when passing `--platform android` |
| -H, --headless                                | [Android Only] Launch Emulator in headless mode. Useful when running on CI. |
| -w, --workers                                 | [iOS Only] Specifies number of workers the test runner should spawn, requires a test runner with parallel execution support (Detox CLI currently supports Jest) |
| -n, --device-name [name]                                 | Override the device name specified in a configuration. Useful for running a single build configuration on multiple devices. |
> NOTE: such log levels as `silly` and `wss` are deprecated since detox@8.1.0 and will be removed in 9.0.0.
> NOTE: extra arguments to `detox test` will be passed through to the test runner (e.g. arguments such as --bail can be passed to Detox and will get forwarded to your test runner)

### build
Run a command defined in 'configuration.build'

`detox build <command> [options]`

| Option | Description |
| --- | --- |
| -h, --help                            |  output usage information |
| -c, --configuration \<device config\> |  Select a device configuration from your defined configurations,if not supplied, and there's only one configuration, detox will default to it |


### run-server

Start a standalone Detox server

`detox run-server [options]`

| Option                 | Description                                         |
| --- | --- |
| -p, --port [port]      | Port number (default: 8099)                         |
| -l, --loglevel [value] | Log level: fatal, error, warn, info, verbose, trace |
| --no-color             | Disable colorful logs                               |
| -h, --help             | output usage information                            |

### init

Scaffolds initial E2E test folder structure for a specific test runner

`detox init -r <test-runner-name>`

| Option                          | Description |
| ---                             | --- |
| -h, --help                      | output usage information |
| -r, --runner <test-runner-name> | test runner name (supported values: mocha, jest) |

### help
Display help for a command

`detox help [command]`

