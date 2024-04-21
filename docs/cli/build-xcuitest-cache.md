# detox build-xcuitest-cache

```bash
detox build-xcuitest-cache
```

**MacOS only.** Builds a cached Detox XCUITest-runner for the current environment.

The cached runner is unique for each combination of Xcode and Detox version.

Detox stores a cached version of the runner in `~/Library/Detox/ios/xcuitest-runner/*` in unique folders, where the folder name
is a hash of Xcode and Detox version:

```plain text
├── ios
│  ├── framework
│  │   ├── 197a0586bd006583562a5916c969d158133a8c50
│  │   ├── …
│  │   └── eddcc1edeffdb3533a977b73b667e1b7f106c38f
│  ├── xcuitest-runner // <- here
|  │   ├── 197a0586bd006583562a5916c969d158133a8c50
│  │   ├── …
│  │   └── eddcc1edeffdb3533a977b73b667e1b7f106c38f
│…
```
