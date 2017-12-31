---
id: Guide.DebuggingInXcode
title: Debugging Apps in Xcode During a Test
---

> Advanced users might need to natively debug their app inside Xcode during a Detox test. This is mostly useful for invesigating weird crahses or when contributing to Detox itself.

This workflow isn't standard. Don't use it unless you have a good reason.

<br>

## Step 1: Add Detox framework to your project

Open your Xcode project and drag `Detox.framework` from `node_modules/detox/Detox.framework` to your project.

> NOTE: Apps should not be submitted to the App Store with the Detox framework linked. Follow this guide only to debug Detox issues in your project. Once finished, make sure to remove `Detox.framework` from your project.

<br>

## Step 2: Add launch arguments

Edit your project scheme and add the following arguments to **Arguments Passed On Launch**:
	
```
-detoxServer
ws://localhost:8099
-detoxSessionId
test
```

<br>

## Step 3: Add custom session to Detox config

Edit Detox config in `package.json` to [add a custom session](/docs/APIRef.Configuration.md#server-configuration) by adding the `session` key under the `detox` section:

```json
"detox": {
  "session": {
    "server": "ws://localhost:8099",
    "sessionId": "test"
  }
}
```

<br>

## Step 4: Add a special xcode configuration to Detox config

Edit Detox config in `package.json` by adding a new configuration with type `ios.none` to the `configurations` key under the `detox` section:

```json
"detox": {
  "configurations": {
    "xcode": {
      "type": "ios.none"
    }
  }
}
```

> NOTE: This configuration will not handle simulator and application lifecycle, they will have to be provided manually (via Xcode "Play" button or `react-native run-ios`).

<br>

## Step 5: Run Detox server manually

Type the following inside your project root:

```sh
detox run-server
```

<br>

## Step 6: Run Detox tests

Type the following inside your project root:

```sh
detox test --configuration xcode
```

> NOTE: Tests that expect the app to be restarted via `device.relaunchApp()` will fail.
