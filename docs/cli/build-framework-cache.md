# detox build-framework-cache

```bash
detox build-framework-cache
```

**MacOS only.**
Builds cached versions of the Detox framework and XCUITest-runner.
This command uses the `--detox` and `--xcuitest` flags to selectively build components. By default, both components are built.

## Options

- `--detox` - Builds **only** the Detox injected framework. Default is false (build both).
- `--xcuitest` - Builds **only** the XCUITest runner. Default is false (build both).

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
