# The `detox` Object

`detox` is globally available in every test. Thought currently it is only used in the setup/init file.

- [`detox.init()`](#detox.init)
- [`detox.cleanup()`](#detox.cleanup)

### `detox.init()`
The setup phase happens inside `detox.init()`. This is the phase where detox reads its configuration, starts a server, loads its expection library and starts a simulator.

### `detox.cleanup()`
The cleanup phase should happen after all the tests have finished. This is the phase where detox-server shuts down. The simulator will also shut itself down if `--cleanup` flag is added to `detox test`