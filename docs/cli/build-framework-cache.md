# detox build-framework-cache

```bash
detox build-framework-cache
```

**MacOS only.** Builds a cached version of `Detox.framework` in `~/Library/Detox/ios/*`.

Detox stores a cached version of its framework in `~/Library/Detox/ios/*` in unique folders, where the folder name
is a hash of Xcode and Detox version:

```plain text
├── ios
│   ├── 197a0586bd006583562a5916c969d158133a8c50
│   ├── …
│   └── eddcc1edeffdb3533a977b73b667e1b7f106c38f
│…
```
