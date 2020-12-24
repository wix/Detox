# Debugging in Android Studio During Detox Tests

> This flow is not standard and serves mostly for investigating weird crashes or
when contributing to Detox itself.  
> **Don't use it unless you have a good reason.**

### Setting Detox up as a compiling dependency

Before you go anywhere further, follow the
[Setting Detox up as a compiling dependency](Introduction.Android.md#setting-detox-up-as-a-compiling-dependency)
section from the **Detox for Android** document.

### Add "manual" device configurations to your .detoxrc

Locate your `.detoxrc` config file or the corresponding `detox` section in your `package.json`
and add a configuration similar to this one:

```json
{
  "configurations": {
    "android.manual": {
      "type": "android.emulator",
      "binaryPath": "<path to your app binary built before>",
      "device": {
        "avdName": "<e.g., Pixel_API_28>"
      },
      "behavior": {
        "launchApp": "manual"
      }
    },
  }
}
```

While the `behavior` section is a **mandatory** thing to include, there are a few more optional
parameters to disable various side effects and make life easier when debugging:

```diff
   "behavior": {
     "launchApp": "manual"
   },
+  "session": {
+    "autoStart": true,
+    "debugSynchronization": 0,
+    "server": "ws://localhost:8099",
+    "sessionId": "test"
+  },
+  "artifacts": false
```

* Using a preconfigured `session` with an autostarting server removes the legwork of copying and
pasting values to the instrumentation runner launch arguments dialog every time before any launch
from the IDE. Otherwise, by default when the `session` object omitted, `server` and `sessionId`
are randomly generated for every new test session.

    * The `debugSynchronization: 0` override matters only if you have a global `session` config
with `debugSynchronization` set to a positive integer value. Otherwise, it is not needed. The point
is to disable regular app polling requests during debugging, since that only can hinder the debugging.

* Setting `artifacts: false` override also matters only if you have a global `artifacts` config.
The motivation is to disable unrelevant taxing activities on the device such as capturing logs
screenshots, videos and so on.
    * If your investigation addresses a specific artifact plugin glitch on the native side, then just
    disable all the other plugins. See [Detox Configuration](APIRef.Configuration.md) document
    for the reference.

### Run a specific test

Usually, you would want to focus on a specific test suite to save time, e.g.:

```
detox test -c android.manual e2e/someSuite.test.js
```

If you are using Jest as a test runner, you might want to increase the test timeout via appending
`--testTimeout 999999` to the command. For Mocha, that would be `--timeout 999999`.

Also, if there is something you want to do step by step in JS code while debugging native, append
`--inspect-brk` flag. To learn more about debugging with `--inspect-brk`, refer to
[Debugging — Getting Started](https://nodejs.org/en/docs/guides/debugging-getting-started/) on the offical Node.js website.

Afterwards, you should see your test suite starting as usual until it reaches the app launch, where
Detox stops instead and prompts you to launch the app from the IDE:

```
detox[53038] INFO:  [AndroidDriver.js] Waiting for you to manually launch your app in Android Studio.

Instrumentation class: com.wix.detox.test.test/com.example.DetoxTestAppJUnitRunner
Instrumentation arguments:
------------------------------------
Key            | Value
------------------------------------
detoxServer    | ws://localhost:8099
detoxSessionId | test
------------------------------------

Press any key to continue...
```

Now it is time to switch back to Android Studio.  However, if for some reason you wish to terminate the process, use Ctrl+C to exit.

## Launching the app

Before you launch the app from Android Studio, make sure to put breakpoints at the points of interest.

You'll need to run your instrumentation runner with the said arguments, this is why you
should create a debug configuration of `Android Instrumented Tests` type similar to the
one below:

![Android Debug Configuration - Android Instrumented Tests](img/android-studio-debug-configuration.png)

The moment you see the app has started on the device, go back to the Terminal where Detox is
running and press any key.

As a result, you are expected to see a confirmation from Detox, e.g.:

```
Found the app (com.wix.detox-example) with process ID = 16854. Proceeding...
```

Now the entire test will run as usual until it sends an action to the app, which gets trapped
in your breakpoint.

![Breakpoint is active](img/android-happy-debugging.png)

Happy debugging!

## Extra tweaks

If you feel like you see too often this timeout error while debugging:

```
Waited for the new RN-context for too long! (60 seconds)
If you think that's not long enough, consider applying a custom Detox runtime-config in DetoxTest.runTests().
```

you can temporarily hack the timeout here:

```diff
diff --git a/detox/android/detox/src/main/java/com/wix/detox/config/DetoxConfig.kt b/detox/android/detox/src/main/java/com/wix/detox/config/DetoxConfig.kt
index b33b2086..aaf8e9e2 100644
--- a/detox/android/detox/src/main/java/com/wix/detox/config/DetoxConfig.kt
+++ b/detox/android/detox/src/main/java/com/wix/detox/config/DetoxConfig.kt
@@ -1,8 +1,10 @@
 package com.wix.detox.config

 class DetoxConfig {
     @JvmField var idlePolicyConfig: DetoxIdlePolicyConfig = DetoxIdlePolicyConfig()
-    @JvmField var rnContextLoadTimeoutSec = 60
+    @JvmField var rnContextLoadTimeoutSec = Int.MAX_VALUE

     fun apply() {
         idlePolicyConfig.apply()
```

