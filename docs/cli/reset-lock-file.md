# detox reset-lock-file

```bash
detox reset-lock-file
```

Resets Detox lock file. The lock file contains information about busy and free devices, and this way we can ensure no device can be used simultaneously by multiple Detox test sessions.

By default, [`detox test`](test.md) command cleans the lock file on start,
but it targets only the devices assigned to dead and non-existent processes.
This command, on contrary, cleans the lock file completely.
