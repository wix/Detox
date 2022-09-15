# Overview

## Config resolution

In order for Detox to know what device & app to use (and a lot more, actually), it needs some configuration to be statically available in a configuration file.
It supports both standalone configuration files, and a configuration bundling inside the project’s `package.json`.

In essence, Detox scans for the configuration to use, through multiple files.
It starts from the current working directory, and runs over the following options, in this order:

1. `.detoxrc.js`
1. `.detoxrc.json`
1. `.detoxrc`
1. `detox.config.js`
1. `detox.config.json`
1. `package.json`

So, you can have a Detox config in a standalone JS or JSON file:

```javascript
/* @type {Detox.DetoxConfig} */
module.exports = {
  devices: { /* ... */ },
  apps: { /* ... */ },
  configurations: { /* ... */ },
};
```

or as a named section inside your `package.json`:

```json
{
  "name": "your-project",
  "version": "X.Y.Z",
  "scripts": {},
// highlight-start
  "detox": {
    "devices": {},
    "apps": {},
    "configurations": {},
  }
// highlight-end
}
```

If you prefer to read TypeScript files instead of docs, you can open now
[the typings file](https://github.com/wix/Detox/blob/master/detox/index.d.ts) provided by Detox.

## Extending configs

Detox config files can be extensible and be extended if you ever need to share certain settings across multiple mobile projects, e.g.:

```json
{
// highlight-next-line
  "extends": "@my-org/detox-preset",
  "apps": {
    // …
  },
}
```

Please note that `extends` has to be a valid Node module path. Relative module paths will be resolved relatively
to the Detox config file which contains that specific `extends` property, e.g.:

```js
// given: ~/Projects/my-project/.detoxrc.json
{ extends: "./e2e/detox-base-config" }
// goes to: ~/Projects/my-project/e2e/detox-base-config.js
{ extends: "./configs/base" }
// then goes to: ~/Projects/my-project/e2e/configs/base/index.js
// and so on...
```

## Individual configurations

`configurations` holds all the device/app-oriented configurations. To select a specific configuration when running Detox in command-line (i.e. `detox build`, `detox test`), use the `--configuration` argument.
Note: If there is only one configuration in `configurations`, Detox will default to it.

| Configuration Params | Details                                                                                                              |
| -------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `device`             | Device config (object) or an alias pointing to an already defined device in `"devices"` dictionary (see below).      |
| `app`                | App config (object) or an alias pointing to an already defined application in `"apps"` dictionary (see below).       |
| `apps`               | Same as the `app`, but that is an array form used for multi-app testing. Mutually exclusive with the `app` property. |
| `artifacts`          | Overrides to the artifacts config. See [Artifacts config](artifacts.md).                                             |
| `behavior`           | Overrides to the behavior config. See [Behavior config](behavior.md).                                                |
| `session`            | Overrides to the session config. See [Session config](session.md).                                                   |
|                      |                                                                                                                      |
| `runnerConfig`       | Path to the test runner config. Default value: `e2e/config.json`.                                                    |
| `specs`              | A default glob pattern for a test runner to use when no test files are specified, e.g.: `e2e/**/*.test.js`           |

**Example:**

```js
{
  // ...
  "detox": {
    // ...
    "devices": {
      // ... see in the next sections ...
    },
    "apps": {
      // ... see in the next sections ...
    },
    "session": {
      // ... see in the next sections ...
    },
    "configurations": {
      "ios.sim.debug": {
        "device": "simulator",
        "app": "ios.debug"
      },
      "android.emu.release": {
        "device": "emulator",
        "app": "android.release"
      },
      "android.att.release": {
        "device": "android.attached",
        "app": "android.release"
      },
      "android.genymotion.release": {
        "device": "android.genycloud",
        "app": "android.release"
      }
    }
  }
}
```

If you have multiple configurations, you'll have to append `-c <configurationName>` to every invocation of
`detox build` and `detox test` CLI, e.g.:

```bash
detox build -c ios.sim.debug
detox test -c ios.sim.debug
```

If this is inconvenient, and you can have some configuration as a default choice, there's a property for that:

```diff
+"selectedConfiguration": "ios.sim.debug",
 "configurations": {
   "ios.sim.debug": {
     "device": "simulator",
     "app": "ios.debug"
   },
```

Obviously, if you have only one configuration, there's no need to specify its name, just use `detox build` and
`detox test` as-is.
