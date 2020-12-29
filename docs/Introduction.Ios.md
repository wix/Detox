# Detox for iOS

### 1. Preliminary

Run through the basic steps of the [Getting Started guide](Introduction.GettingStarted.md), such as the environment and tools setup.

### 2. Apply Detox Configuration

Whether you've selected to apply the configuration in a  `.detoxrc.json` or bundle it into your project's `package.json` (under the `detox` section), this is what the configuration should roughly look like for iOS:

```json
{
  "configurations": {
    "ios.sim.release": {
      "binaryPath": <path to .app bundle>,
      "build": <xcodebuild command>,
      "type": "ios.simulator",
      "device": {
        "type": "iPhone 12 Pro Max"
      }
    }
  }
}
```

For a comprehensive explanation of Detox configuration, see our [dedicated API-reference guide](APIRef.Configuration.md).

In the above configuration example, make sure to provide the correct information for your project/app. Under the key `"binaryPath"`, you should provide the path of the .app bundle to use. Normally, this is the path where the `"build”` command would output this bundle. Under the key `"build"`, specify the `xcodebuild` command for your project.

Also make sure the simulator model specified under the key `device.type` (e.g. `iPhone 12 Pro Max` above) is actually available on your machine (it was installed by Xcode). Check this by typing `applesimutils --list` in Terminal to display all available simulators.

For a complete, working example, refer to the [Detox example project configuration](https://github.com/wix/Detox/blob/master/detox/test/package.json).
