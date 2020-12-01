# Debugging in Xcode During Detox Tests

> This is mostly useful for investigating weird crashes or when contributing to Detox itself. **This workflow isn't standard. Don't use it unless you have a good reason.**

### Add Detox Framework to Your Project

* Go to `node_modules/detox` and extract `Detox-ios-src.tbz`
* Drag `Detox-ios-src/Detox.xcodeproj` into your Xcode project
* Go to your project settings -> **General** and add **Detox.framework** to **Frameworks, Libraries, and Embedded Content** (make sure **Embed & Sign** is selected under **Embed**)

> NOTE: Apps should not be submitted to the App Store with the Detox framework linked. Follow this guide only to debug Detox issues in your project. Once finished, make sure to remove **Detox.framework** from your project.

### Add an `ios.none` Configuration to Detox Section

Edit your Detox configuration to add the following configuration:

```json
"ios.none": {
  "binaryPath": "ios",
  "type": "ios.none",
  "device": {
    "type": "iPhone 12 Pro Max"
  },
  "session": {
    "server": "ws://localhost:8099",
    "sessionId": <your app's bundle identifier>
  }
}
```

> **Note:** This configuration will not handle simulator and application lifecycle, they will have to be performed manually (e.g. running your application from Xcode).

### Run Detox Server Manually

Run the following command in your project root directory:

```sh
detox run-server
```

### Run Your Application From Xcode

Run your application from Xcode as you normally do.

> **Note:** Before running, place breakpoints in places where you wish to debug.

### Run Detox Tests

Run the following command in your project root directory:

```sh
detox test --configuration ios.none
```

> **Note:** Calls to `device.launchApp()` may fail as this API is unavailable when using `ios.none` configuration types. Instead, use `it.only` to run specific tests and restart your app from Xcode.
