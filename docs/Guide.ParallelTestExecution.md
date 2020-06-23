# Parallel Test Execution

Detox can leverage multi worker support of JS test runners ([Jest](http://jestjs.io/docs/en/cli#maxworkers-num), [AVA](https://github.com/avajs/ava#process-isolation), etc.).

By default `detox test` will run the test runner with one worker (it will pass `--maxWorkers=1` to Jest cli, Mocha is unaffected). Worker count can be controlled by adding `--workers n` to `detox test`, read more in [detox-cli section](APIRef.DetoxCLI.md#test).

## Device Creation

While running with multiple workers, Detox might not have an available simulator for every worker.
If no simulator is available for that worker, the worker will create one with the name `{name}-Detox`.

## Lock File

Simulators/emulators run on a different process, outside of node, and require some sort of lock mechanism to make sure only one process controlls a simulator in a given time. Therefore, Detox 7.4.0 introduced `device.registry.state.lock`, a lock file controlled by Detox, that registers all in-use simulators.

> **Note:** Each worker is responsible of removing the deviceId from the list in `device.registry.state.lock`. Exiting a test runner abruptly (using ctrl+c / ⌘+c) will not give the worker a chance to deregister the device from the lock file, resulting in an inconsistent state, which can result in creation of unnecessary new simulators. 
>
>* detox-cli makes sure `device.registry.state.lock` is cleaned whenever it executes.
>* If you use Detox without detox-cli make sure you delete or reset the lock file before running tests.
>
>	```sh
>	echo "[]" > ~/Library/Detox/device.registry.state.lock
>	```
>

The lock file location is determined by the OS, and [defined here](https://github.com/wix/detox/blob/master/detox/src/utils/appdatapath.js).

* **MacOS**: `~/Library/Detox/device.registry.state.lock`
* **Linux**: `~/.local/share/Detox/device.registry.state.lock`
* **Windows**: `%LOCALAPPDATA%/data/Detox/device.registry.state.lock` or `%USERPROFILE%/Application Data/Detox/device.registry.state.lock`

### Persisting the Lock File

By default, once all workers finish their test runs, Detox will delete the lock file. Under certain conditions, you may want to persist the lock file. Use the `--keepLockFile` flag to disable automatic deletion.
