# Session

Detox can either initialize a server using a generated configuration, or can be overridden with a manual configuration:

```json
{
  "session": {
    "server": "ws://localhost:8099",
    "sessionId": "YourProjectSessionId"
  }
}
```

When you define a session config, the Detox server won’t start automatically anymore — it is assumed that
you will be running it independently via `detox run-server` CLI command. Alternatively, you can set the
`autoStart` property to be explicitly `true`:

```diff
   "session": {
+    "autoStart": true,
     "server": "ws://localhost:8099",
     "sessionId": "YourProjectSessionId"
```

Defining an explicit session config with `server` and `sessionId` also means you cannot use multiple workers,
since the specified port will become busy for any test worker next to the first one to occupy it.

Session can be set also per device configuration — then it takes a higher priority over the global
session config:

```json
{
  "configurations": {
    "ios.sim.debug": {
      // ...
      "session": {
        "server": "ws://localhost:8099",
        "sessionId": "YourProjectSessionId"
      }
    }
  }
}
```

Also, you can specify an optional numeric `debugSynchronization` parameter
(see also `--debug-synchronization` in [`detox-cli` test section](../api/detox-cli.md#test)).
When an action/expectation takes a significant amount time, use this option to print device synchronization status.
The status will be printed if the action takes more than _\[N]_ ms to complete.

```json
{
  "session": {
    "debugSynchronization": 20000
  }
}
```

To disable `debugSynchronization` explicitly, use `0`.
