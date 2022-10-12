# detox

Detox CLI lets you operate Detox from command line.

## Installation

Install `detox-cli` globally via [npm](http://npmjs.org/detox-cli):

```bash npm2yarn
npm install detox-cli --global
```

## Usage

```bash
detox <command> [options]
```

## Commands

| Command                   | Description                                                                                                                                                   |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [init]                    | Create initial E2E tests folder for Detox.                                                                                                                    |
| [build]                   | Run the command defined in 'build' property of the specified configuration.                                                                                   |
| [test]                    | Initiating your test suite.                                                                                                                                   |
| [recorder]                | Starts a [Detox Recorder](https://github.com/wix/DetoxRecorder) recording.                                                                                    |
| [build-framework-cache]   | **MacOS only.** Builds Detox.framework to \~/Library/Detox. The framework cache is specific for each combination of Xcode and Detox versions.                 |
| [clean-framework-cache]   | **MacOS only.** Deletes all compiled framework binaries from \~/Library/Detox, they will be rebuilt on 'npm install' or when running 'build-framework-cache'. |
| [rebuild-framework-cache] | **MacOS only.** Rebuilds the Detox cache.                                                                                                                     |
| [reset-lock-file]         | Resets all Detox lock files. Useful when you need to run multiple `detox test … --keepLockFile` commands in parallel.                                         |
| [run-server]              | Starts a standalone Detox server.                                                                                                                             |

## Options

| Options   | Description         |
| --------- | ------------------- |
| --version | Show version number |
| --help    | Show help           |

[init]: init.md

[build]: build.md

[test]: test.md

[recorder]: recorder.md

[build-framework-cache]: build-framework-cache.md

[clean-framework-cache]: clean-framework-cache.md

[rebuild-framework-cache]: rebuild-framework-cache.md

[reset-lock-file]: reset-lock-file.md

[run-server]: run-server.md
