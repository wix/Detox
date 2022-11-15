---
id: ios
slug: introduction/ios
title: Detox for iOS
sidebar_label: Detox for iOS
---

## Detox for iOS

### 1. Preliminary

Run through the basic steps of the [Getting Started guide](introduction/getting-started.md), such as the environment and tools setup.

### 2. Apply Detox Configuration

Whether you’ve selected to apply the configuration in a  `.detoxrc.json` or bundle it into your project’s `package.json` (under the `detox` section), this is what the configuration should roughly look like for iOS:

```json
{
  "devices": {
    "simulator": {
      "type": "ios.simulator",
      "device": {
        "type": "iPhone 12 Pro Max"
      }
    }
  },
  "apps": {
    "ios.release": {
      "name": "YourProject",
      "type": "ios.app",
      "binaryPath": "ios/build/Build/Products/Release-iphonesimulator/YourProject.app",
      "build": "xcodebuild -project ios/YourProject.xcodeproj -scheme YourProject -sdk iphonesimulator -derivedDataPath ios/build"
    }
  },
  "configurations": {
    "ios.sim.release": {
      "device": "simulator",
      "app": "ios.release"
    }
  }
}
```

:::info

For a comprehensive explanation of Detox configuration, see our [dedicated API-reference guide](config/overview.md).

:::

In the above configuration example, make sure to provide the correct information for your project/app. Under the key `"binaryPath"`, you should provide the path of the .app bundle to use. Normally, this is the path where the `"build”` command would output this bundle. Under the key `"build"`, specify the `xcodebuild` command for your project.

:::tip

If your app uses CocoaPods, pass `-workspace` in your `xcodebuild` command, for example:

```json
"build": "xcodebuild -workspace ios/YourProject.xcworkspace -scheme YourProject -sdk iphonesimulator -derivedDataPath ios/build"
```

:::

:::info

For more information on using the xcodebuild command, visit [Apple Docs](https://developer.apple.com/library/archive/technotes/tn2339/_index.html#//apple_ref/doc/uid/DTS40014588-CH1-HOW_DO_I_BUILD_MY_PROJECTS_FROM_THE_COMMAND_LINE_).

:::

Also, make sure the simulator model specified under the key `device.type` (e.g. `iPhone 12 Pro Max` above) is actually available on your machine (it was installed by Xcode). Check this by typing `applesimutils --list` in Terminal to display all available simulators.

For a complete, working example, refer to the [Detox example project configuration](https://github.com/wix/Detox/blob/master/detox/test/package.json).
