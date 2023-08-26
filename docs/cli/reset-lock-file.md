# detox reset-lock-file

```bash
detox reset-lock-file
```

Resets Detox lock files. The lock files contain information about busy and free devices, and this way we can
ensure no device can be used simultaneously by multiple test workers.

By default, [`detox test`](test.md) command always cleans the shared lock files on start,
assuming it had been left from the preceding interrupted finished test session.

If you run multiple `detox test` commands in parallel, only the first one will clean the lock files
to make sure that the other commands will not interfere with each other.
