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
| -h <br> --help                                                            | output usage information |
| -r [runner] <br> <nobr>--runner [runner]</nobr>                           | Test runner (currently supports mocha) |
| -o \<config\> <br> <nobr>--runner-config \<config\></nobr>                | Test runner config file |
| -l [value] <br> <nobr>--loglevel [value]</nobr>                           | info, debug, verbose, silly, wss |
| -c \<device config\> <br> <nobr>--configuration \<device config\></nobr>  | Select a device configuration from your defined figurations,if not supplied, and there's only one configuration, detox will default to it |
| -r <br> --reuse                                                           | Reuse existing installed app (do not delete and re-tall) for a faster run. |
| -u <br> --cleanup                                                         | shutdown simulator when test is over, useful for CI ipts, to make sure detox exists cleanly with no residue |
| -d \<value\> <br> <nobr>--debug-synchronization \<value\><nobr>           | When an action/expectation takes a significant amount time use this option to print device synchronization status. The status will be printed if the ion takes more than [value]ms to complete |
| -a \<path\> <br> <nobr>--artifacts-location \<path\></nobr>               | Artifacts destination path (currently contains only logs). If the destination already exists, it will be removed first |
    
    

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

