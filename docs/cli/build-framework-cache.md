# detox build-framework-cache

```bash
detox build-framework-cache
```

**MacOS only.** 
Builds or rebuilds a cached Detox framework and/or XCUITest-runner for the current environment in `~/Library/Detox`. 
Supports `--build` and `--clean` options to specify what to build or clean. Defaults to building both without cleaning.

Detox stores a cached version of its framework and XCUITest-runner in `~/Library/Detox/ios/*` in unique folders, where the folder name
is a hash of Xcode and Detox version combination. This cache is used to speed up the build process and avoid unnecessary recompilations.

Here is an example of the cache structure:
```plain text
├── ios
│  ├── framework
│  │   ├── 197a0586bd006583562a5916c969d158133a8c50
│  │   ├── …
│  │   └── eddcc1edeffdb3533a977b73b667e1b7f106c38f
│  ├── xcuitest-runner
|  │   ├── 197a0586bd006583562a5916c969d158133a8c50
│  │   ├── …
│  │   └── eddcc1edeffdb3533a977b73b667e1b7f106c38f
│…
```

## Options

- `--build` - Builds the cached framework and XCUITest-runner. Accepts `all`, `detox`, `xcuitest` or `none`. Defaults to `all`.
- `--clean` - Deletes the cached framework and XCUITest-runner. Accepts `all`, `detox`, `xcuitest` or `none`. Defaults to `none`.
