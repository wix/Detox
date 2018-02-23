---
id: version-7.X-APIRef.DetoxCLI
title: Detox Command Line Tools (detox-cli)
original_id: APIRef.DetoxCLI
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
| [init](#init)              | Create initial e2e tests folder |
| clean-framework-cache | Delete all compiled framework binaries from ~/Library/Detox, they will be rebuilt on 'npm install' or when running 'build-framework-cache'
| build-framework-cache | Build Detox.framework to ~/Library/Detox. The framework cache is specific for each combination of Xcode and Detox versions
| [help](#help)              | Display help for specific command |

## Options:

| Options | Description |
| --- | --- |
| -h<br>--help | Output usage information |

## Commands

### test
Initiating your test suite

`detox test [options]`



| Option| Description |
| --- | --- |
| -h, --help                                    | output usage information |
| -o, --runner-config \<config\>                | Test runner config file, defaults to 'e2e/mocha.opts' for mocha and 'e2e/config.json' for jest |
| -l, --loglevel [value]                        | info, debug, verbose, silly, wss |
| -c, -configuration \<device config\>          | Select a device configuration from your defined configurations,if not supplied, and there's only one configuration, detox will default to it |
| -r, --reuse                                   | Reuse existing installed app (do not delete and re-tall) for a faster run. |
| -u, --cleanup                                 | Shutdown simulator when test is over, useful for CI ipts, to make sure detox exists cleanly with no residue |
| -d, --debug-synchronization \<value\>         | When an action/expectation takes a significant amount time use this option to print device synchronization status. The status will be printed if the ion takes more than [value]ms to complete |
| -a, --artifacts-location \<path\>             | Artifacts destination path (currently contains only logs). For more details, please check the [Artifacts doc](APIRef.Artifacts.md#artifacts) |
|-p, --platform [ios/android]		           | Run platform specific tests. Runs tests with invert grep on `:platform:`, e.g test with substring `:ios:` in its name will not run when passing `--platform android`
|&#8195;&#8195;&#8195;&#8195;&#8195;&#8195;&#8195;&#8195;&#8195;&#8195;&#8195;&#8195;&#8195;&#8195;&#8195;&#8195;&#8195;&#8195;||



### build
Run a command defined in 'configuration.build'

`detox build <command> [options]`

| Option | Description |
| --- | --- |
| -h, --help                            |  output usage information |
| -c, --configuration \<device config\> |  Select a device configuration from your defined configurations,if not supplied, and there's only one configuration, detox will default to it |
|&#8195;&#8195;&#8195;&#8195;&#8195;&#8195;&#8195;&#8195;&#8195;&#8195;&#8195;&#8195;&#8195;&#8195;&#8195;&#8195;&#8195;&#8195;||


### run-server
Start a standalone detox server

`detox run-server [options]`

| Option | Description |
| --- | --- |
| -h, --help |  output usage information |


### init
Create initial e2e tests folder

`detox init [options`

| Option | Description |
| --- | --- |
| -h, --help   |  output usage information |
| -r, --runner | Test runner (currently supports only `mocha`) |

### help
Display help for a command

`detox help [command]`

