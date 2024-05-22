# detox clean-framework-cache

```bash
detox clean-framework-cache
```

**MacOS only.**
Cleans cached versions of the Detox framework and XCUITest-runner.
This command uses the `--detox` and `--xcuitest` flags to selectively remove components. By default, both components are cleaned.

## Options

- `--detox` - Cleans **only** the Detox injected framework. Default is false (clean both).
- `--xcuitest` - Cleans **only** the XCUITest runner. Default is false (clean both).

See also: [`detox build-framework-cache`](build-framework-cache.md)
