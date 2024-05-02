# detox rebuild-framework-cache

```bash
detox rebuild-framework-cache
```

**MacOS only.**
Alias for `detox build-framework-cache --clean="all" --build="all"`. 
Deletes all Detox cached frameworks and XCUITest-runners from `~/Library/Detox`, 
and rebuilds a new one for the current environment.

See also: [`detox build-framework-cache`](build-framework-cache.md)
