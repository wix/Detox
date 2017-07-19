# Detox Command Line Tools (detox-cli)

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
| [help](#help)              | Display help for specific command |

## Options:

| Options | Description |
| --- | --- |
| -h<br>--help | Output usage information |

## Commands

### test
Initiating your test suite

`detox test [options]`

| Option | Description |
| --- | --- |
| -h, --help                                    | output usage information |
| -r, --runner [runner]                         | Test runner (currently supports mocha) |
| -o, --runner-config \<config\>                | Test runner config file |
| -l, --loglevel [value]                        | info, debug, verbose, silly, wss |
| -c, --configuration \<device config\>         | Select a device configuration from your defined figurations,if not supplied, and there's only one configuration, detox will default to it |
| -r, --reuse                                   | Reuse existing installed app (do not delete and re-tall) for a faster run. |
| -u, --cleanup                                 | shutdown simulator when test is over, useful for CI ipts, to make sure detox exists cleanly with no residue |
| -d, --debug-synchronization \<value\>         | When an action/expectation takes a significant amount time use this option to print device synchronization status. The status will be printed if the ion takes more than [value]ms to complete |
| -a, --artifacts-location \<path\>             | Artifacts destination path (currently contains only logs). For more details, please check the [Artifacts doc](APIRef.Artifacts.md#artifacts) |
    
    

### build
Run a command defined in 'configuration.build'

`detox build <command> [options]`

| Option | Description |
| --- | --- |
| -h <br> --help                                                           |  output usage information |
| -c \<device config\> <br> <nobr>--configuration \<device config\></nobr> |  Select a device configuration from your defined configurations,if not supplied, and there's only one configuration, detox will default to it |


### run-server
Start a standalone detox server

`detox run-server [options]`

| Option | Description |
| --- | --- |
| -h <br> --help |  output usage information |


### init
Create initial e2e tests folder

`detox init [options`

| Option | Description |
| --- | --- |
| -h <br> --help |  output usage information |
| -r \<runner\>  | <nobr>--runner \<runner\></nobr> Test runner (currently supports only `mocha`) |

### help
Display help for a command

`detox help [command]`

