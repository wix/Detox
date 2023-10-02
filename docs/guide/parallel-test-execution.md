# Parallel Test Execution

Detox comes out of the box with multi-worker support thanks to ([Jest's feature](http://jestjs.io/docs/en/cli#maxworkers-num),  etc.).

By default `detox test` will run the test runner with one worker. Worker count can be controlled by forwarding `--maxWorkers <N>` to Jest via [`detox test`](../cli/test.md).

## Device Creation

While running with multiple workers, Detox might not have an available simulator for every worker.
If no simulator is available for that worker, the worker will create one with the name `{name}-Detox`.

## Lock File

Since any attached device can potentially be used simultaneously by multiple workers, Detox needs to maintain a lock file to make sure that doesn't happen.
Therefore, Detox maintains `device.registry.json`, a file with exclusive access based on `proper-lockfile`, controlled by Detox, that registers all simulators and emulators
currently in use by Detox instances.

The lock file location is determined by the OS, and [defined here](https://github.com/wix/detox/blob/master/detox/src/utils/appdatapath.js).

- **MacOS**: `~/Library/Detox/device.registry.json`
- **Linux**: `~/.local/share/Detox/device.registry.json`
- **Windows**: `%LOCALAPPDATA%/data/Detox/device.registry.json` or `%USERPROFILE%/Application Data/Detox/device.registry.json`
