# Detox for iOS

### 1. Preliminary

Run through the basic steps of the [Getting Started guide](Introduction.GettingStarted.md), such as the environment and tools setup.

### 2. Apply Detox Configuration

Whether you've selected to apply the configuration in a  `.detoxrc.json` or bundle it into your project's `package.json` (under the `detox` section), this is what the configuration should roughly look like for iOS:

```json
{
  "configurations": {
    "ios.sim.debug": {
      "binaryPath": "ios/build/Build/Products/Debug-iphonesimulator/example.app",
      "build": "xcodebuild -project ios/example.xcodeproj -scheme example -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build",
      "type": "ios.simulator",
      "device": {
        "type": "iPhone 11 Pro"
      }
    }
  }
}
```

> For a comprehensive explanation of Detox configuration, refer to the [dedicated API-reference guide](APIRef.Configuration.md).

In the above configuration example, change `example` to your actual project name. Under the key `"binaryPath"`, `example.app` should be `<your_project_name>.app`. Under the key `"build"`, `example.xcodeproj` should be `<your_project_name>.xcodeproj` and `-scheme example` should be `-scheme <your_project_name>`.

For React Native 0.60 or above, or any other iOS apps in a workspace (eg: CocoaPods) use `-workspace ios/example.xcworkspace` instead of `-project`.

Also make sure the simulator model specified under the key `device.type` (e.g. `iPhone 11 Pro` above) is actually available on your machine (it was installed by Xcode). Check this by typing `applesimutils --list` in terminal to display all available simulators.

> Tip: To test a release version, replace 'Debug' with 'Release' in the binaryPath and build properties.

For a complete, working example, refer to the [Detox example app](/examples/demo-react-native/detox.config.js).

