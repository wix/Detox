# Behavior

If you need to tweak the flow of `detox.init()` or `detox.cleanup()` steps,
you have a few options to change. These are the default behavior values:

```json
{
  "detox": {
    "behavior": {
      "init": {
        "reinstallApp": true,
        "exposeGlobals": true
      },
      "launchApp": "auto",
      "cleanup": {
        "shutdownDevice": false
      }
    }
  }
}
```

The `launchApp: "auto"` setting can be changed to `"manual"` for cases when you want to [debug the
native codebase](../introduction/debugging.mdx) when running Detox tests. When set to `manual`, it also
changes the default value of `reinstallApp` to `false`.

Setting `reinstallApp: false` will make the tests reuse the currently installed app on the device,
provided you have installed it beforehand explicitly or manually.

If you do not wish to leak Detox globals (`expect`, `device`, `by`, etc.) to the global
scope, you can set `"exposeGlobals": false` and destructure them respectively from the
exported Detox interface:

```js
import { by, device, expect, element } from 'detox'; // TypeScript
const { by, device, expect, element } = require('detox'); // CommonJS
```

Also, you can override the behavior in specific Detox configurations:

```js
{
  "behavior": {
    // ... global behavior ...
  },
  "configurations": {
    "ios.manual": {
      "behavior": {
        // ... overrides ...
        "launchApp": "manual"
        // ... overrides ...
      }
    }
  }
}
```
