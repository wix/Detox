# Debugging Native Code During a Test

This is an advanced workflow which serves mostly for investigating weird app crashes or
contributing to Detox itself.

### Setting Detox up as a compiling dependency

#### iOS

- Go to `node_modules/detox` and extract `Detox-ios-src.tbz`

![extracted detox-ios-src directory](https://user-images.githubusercontent.com/1962469/103086842-55dcd180-45ee-11eb-9fd9-33e8c5b1df42.png)

- Drag `Detox-ios-src/Detox.xcodeproj` into your Xcode project

![Detox inside Xcode project](https://user-images.githubusercontent.com/1962469/103087243-7e190000-45ef-11eb-90c3-36659870bc3c.png)

- Go to your project settings -> **General** and add **Detox.framework** to **Frameworks, Libraries, and Embedded Content** (make sure **Embed & Sign** is selected under **Embed**)

![embed Detox](https://user-images.githubusercontent.com/1962469/103087279-9be66500-45ef-11eb-8b8b-c34480379216.png)

#### Android

Follow [Setting Detox up as a compiling dependency](Introduction.Android.md#setting-detox-up-as-a-compiling-dependency) guide in the Android introduction document.

### Add "manual" device configurations to your .detoxrc

Edit the `detox` section in `package.json` (or your `.detoxrc`) to add similar configurations:

```json
{
  "configurations": {
    "ios.manual": {
      "type": "ios.simulator",
      "binaryPath": "<path to your app binary built before>",
      "device": {
        "type": "<e.g., iPhone 12 Pro>"
      },
      "behavior": {
        "launchApp": "manual"
      }
    },
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

Note the `behavior` section is the thing that makes the app launch a manual step, and this is a
mandatory thing that cannot be omitted.

Also, to make life easier when debugging, you could also add a few more parameters to those
configurations:

```diff
   "behavior": {
     "launchApp": "manual"
   },
+  "artifacts": false,
+  "session": {
+    "autoStart": true,
+    "debugSynchronization": 0,
+    "server": "ws://localhost:8099",
+    "sessionId": "<your app's bundle identifier>"
+  },
```

Setting `artifacts` property to `false` ensures there won't be extra taxing activities on the
device such as capturing logs, screenshots, videos and so on, unless a specific artifact plugin is
exactly your problem you are debugging.

Using preconfigured `session` with a server `autoStart`-ing at `8099` port and `sessionId` matching your app's
bundle identifier just saves your time for launching your app via IDE, because by default those values are
randomly generated for every new test run, and this is not something you want to copy and paste to
app launch arguments dialog every time.

The `debugSynchronization` property set to `0` matters only if you have a global `session` config
with `debugSynchronization` set to a positive integer value. Otherwise, it is not needed. The point
is to disable regular app polling requests during debugging, since that only can hinder the process.

## Run the specific test

Usually, you would want to focus on a specific test suite to save time:

```
detox test -c ios.manual e2e/someSuite.test.js
```

If you are using Jest underneath, you might want to increase the test timeout:

```
detox test -c ios.manual e2e/someSuite.test.js --testTimeout 999999
```

For Mocha, try `--timeout 999999`.

Also, if there is something you want to do step by step in JS code while debugging native, append
`--inspect-brk` flag:

```
detox test -c ios.manual e2e/someSuite.test.js --inspect-brk
```

To learn more about debugging with `--inspect-brk`, refer to [Debugging — Getting Started](https://nodejs.org/en/docs/guides/debugging-getting-started/) on the official Node.js website:

![Chrome Inspect tab](https://user-images.githubusercontent.com/1962469/103086457-5fb20500-45ed-11eb-8b28-906abab66f45.png)

Afterwards, you should see your test suite starting as usual until it reaches the app launch, where
Detox stops instead and prompts you to launch the app from the IDE.

## Configure launch arguments

### iOS

For iOS, the prompt will look similar to this:

```
detox[16804] INFO:  [SimulatorDriver.js] Waiting for you to manually launch your app in Xcode.
Make sure to pass the launch arguments listed below:
  -detoxServer ws://localhost:8099
  -detoxSessionId com.wix.detox-example

Press any key to continue...
```

You’ll need to run your app with the said arguments from Xcode (although, if your `-detoxServer` and
`-detoxSessionId` already correspond to the default values, then you may omit them):

![Xcode - Edit Schema - Arguments tab](https://user-images.githubusercontent.com/1962469/102654237-e5126100-4178-11eb-81f4-34c1dd2ca357.png)

### Android

For Android, the prompt will look similar to this:

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

You’ll need to run your app with the said arguments from Android Studio (at the moment, you cannot omit them contrary to iOS implementation):

![Android Debug Configuration - Android Instrumented Tests](https://user-images.githubusercontent.com/1962469/102651211-d3c75580-4174-11eb-8cf8-1587329820aa.png)

## Launch the app

Before you launch the app, make sure to put breakpoints at the points of interest, e.g.:

![put a breakpoint in the native code](https://user-images.githubusercontent.com/1962469/103086544-8d974980-45ed-11eb-8057-e03d9f664cad.png)

Launch the app with the debugger attached:

![launching the app](https://user-images.githubusercontent.com/1962469/103086633-ca634080-45ed-11eb-9443-713ef46a1c35.png)

The moment you see the app is idle, go back to the Terminal where Detox is running
and press any key. If you wish to terminate the process for some reason, use Ctrl+C.
In a couple of seconds you are expected to see a confirmation from Detox, e.g.:

```
Found the app (com.wix.detox-example) with process ID = 16854. Proceeding...
```

Now the entire test will run as usual until it sends an action to the app, which gets trapped
in your breakpoint. If you are there, we wish you...

Happy debugging! 🥳
