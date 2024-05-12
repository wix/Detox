# detox rebuild-framework-cache

```bash
detox rebuild-framework-cache
```

**MacOS only.**
Rebuilds cached versions of the Detox framework and XCUITest-runner.
This command uses the `--detox` and `--xcuitest` flags to selectively rebuild components. By default, both components are rebuilt.

## Options

- `--detox` - Rebuilds **only** the Detox injected framework. Default is false (rebuild both).
- `--xcuitest` - Rebuilds **only** the XCUITest runner. Default is false (rebuild both).

See also: [`detox build-framework-cache`](build-framework-cache.md)
