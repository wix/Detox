# detox start

`detox start [options]`

Runs the [`start` command](../config/apps.mdx#properties) of the app (or apps)
from the specified [configuration](../config/overview.mdx#config-structure).

| Option                                | Description                                                                                                                                                                              |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| -C, --config-path `<configPath>`      | Specify Detox config file path. If not supplied, Detox searches for .detoxrc\[.js] or "detox" section in package.json.                                                                   |
| -c, --configuration `<device config>` | Select a local configuration from your defined configurations to extract the app "start" scripts from it. If not supplied, and there’s only one configuration, Detox will default to it. |
| -f, --force                           | Ignore errors from the "start" scripts and continue.                                                                                                                                     |
| --help                                | Show help                                                                                                                                                                                |

## Examples

If you have only one configuration, you can simply use:

```bash
detox start
```

To choose a specific configuration:

```bash
# long alias:
detox start --configuration yourConfiguration
# short alias:
detox start -c yourConfiguration
```

To forward extra arguments to the "start" script, e.g.:

```bash
detox start -c yourConfiguration -- --port 8082
```

To ignore errors from the "start" scripts and continue:

```bash
detox start -c yourConfiguration --force
```
