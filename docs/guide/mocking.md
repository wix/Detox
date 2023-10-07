---
id: mocking
---

# Mocking Guide

:::info

This article previously focused on the older React Native versions (`<0.59`), so if you need to access it, [follow this Git history link](https://github.com/wix/Detox/blob/01ad250fe4168502a57339b8bcab0ec5a5c89e4b/docs/Guide.Mocking.md).

:::

Mocking is an integral part of testing.
You may want to use mocks to alter specific behavior of your app during tests, e.g., to:

- change server endpoints to point to a mock/staging server instead of the regular production server;
- stub a feature the simulator doesn’t support;
- prepare mock environment data such as GPS position, Contacts/Photos found on the device, etc.

This guide assumes you are testing a React Native app with Detox.

Please note that you **cannot** apply mocking techniques familiar from the prior Jest experience, even though Detox runs on top of Jest, e.g.:

```js
jest.mock('./src/myModule'); // NO, THIS WON'T WORK
```

All the mocking must be conducted with the help of [Metro bundler](https://facebook.github.io/metro), which powers React Native under the hood.
Thanks to Metro bundler, there are two modes your React Native application can run in:

1. **Debug mode**. Running `npx react-native start` spawns the _Metro bundler_ on port 8081 (by default). It serves JavaScript files of your app over HTTP, expecting that the native code will request it right upon the launch on the mobile device. Thus, the native app keeps re-downloading and executing the new code every time you change the code locally.

1. **Release mode**. In contrast to the debug mode, _Metro bundler_ does not need to run as a server on the side. It bundles your JavaScript code once into the native app binary file. Hence, every edit to the source code requires rebuilding the entire app binary and reinstalling it on the device before you can see the effect.

There are two ways to configure the _Metro bundler_ to use your mocks: quick (**debug mode** only) and universal.
Let's start with the quicker way.

## Quick flow

1. Pick a module that you are going to mock, e.g.:

   ```js title=src/config.js
   export const SERVER_URL = 'https://production.mycompany.name/api';
   export const FETCH_TIMEOUT = 60000;
   ```

1. Create a mock module alongside, with an arbitrary extension (e.g. `.e2e.js`):

   ```js title=src/config.e2e.js
   export * from './config.js';

   // override the url from the original file:
   export const SERVER_URL = 'http://localhost:3000/api';
   ```

1. Stop your _Metro bundler_ if it has been already running, and run it again with the corresponding file extension override, e.g.:

   ```bash
   npx react-native start --sourceExts e2e.js,js,json,ts,tsx
   ```

   This command is already enough to start your application in an altered mode, and you can start running your tests. Now, if some module imports `./src/config`, you tell _Metro bundler_ to prefer `./src/config.e2e.js` over the plain `./src/config.js`, which means the consumer gets the mocked implementation.

:::caution Caveat

Whichever file extension you might take for the mock files – make sure you don’t accidentally "pick up" unforeseen file overrides from `node_modules/**/*.your-extension.js`!
_Metro bundler_ does not limit itself to your project files only – applying those `--sourceExts` also affects the resolution of the `node_modules` content!

:::

## Configuring Metro bundler

While the mentioned way is good enough for the **debug mode**, it falls short for the **release builds**. The problem is that the `--sourceExts` argument is supported only by `react-native start` command. Hence, you’d need a CLI-independent way to configure your Metro bundler, and that is patching your project's `metro.config.js`:

```js title="metro.config.js"
/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */
const defaultSourceExts = require('metro-config/src/defaults/defaults').sourceExts;

module.exports = {
// highlight-start
  resolver: {
    sourceExts: process.env.MY_APP_MODE === 'mocked'
        ? ['e2e.js', ...defaultSourceExts]
        : defaultSourceExts,
  },
// highlight-end
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
};
```

This way, we are enforcing a custom convention that if the Metro bundler finds the `MY_APP_MODE=mocked` environment variable, it should apply our `sourceExts` override instead of the default values.

Therefore, to start the Metro bundler in the mocked mode, you would run something like:

```bash
MY_APP_MODE=mocked npx react-native start
```

This principle stays the same for the **release mode**, although the build commands might differ depending on the platform and a specific script:

```bash
export MY_APP_MODE=mocked
# from now on, even an implicit run of Metro bundler will use our override

# via React Native CLI
npx react-native run-ios --configuration Release
npx react-native run-android --variant=release

# via native tools
xcodebuild -workspace ... -configuration release -scheme ...
./gradlew assembleRelease
```

Please note that preparing React Native apps for the release mode requires groundwork for both [iOS](https://reactnative.dev/docs/publishing-to-app-store) and [Android](https://reactnative.dev/docs/signed-apk-android), which is out of scope of this current article.

As you might have noticed, until now, this tutorial had no direct connection to Detox itself, and that's a correct observation.
The suggested static mocking techniques are a part of the React Native world itself, so please consult the further resources if you need more information:

- <https://facebook.github.io/metro/>
- <https://github.com/react-native-community/cli/blob/master/docs/commands.md>

## Dynamic Mocking with Backdoor API

In scenarios where static mocking is not sufficiently flexible, Detox's [Backdoor API](../api/device.md#devicebackdoormessage) presents a strategy for **dynamic mocking** during test runtime.
This allows tests to instruct the app to modify its internal state without interacting with the UI, thereby providing additional control over the app's behavior during test execution.

:::info Before you continue

The dynamic mocking is an extension of the static mocking approach, so make sure your **read the previous section**, as it provides the necessary background.

:::

Imagine you have a time service in your app, responsible for providing the current time:

```js title=src/services/TimeService.js
export class TimeService {
    now() {
        return Date.now();
    }
}
```

Now, for testing purposes, we can create a mocked counterpart that allows its internal time to be set dynamically:

```js title=src/services/TimeService.e2e.js
import { detoxBackdoor } from 'detox/react-native';

export class FakeTimeService {
  #now = Date.now();

  constructor() {
    detoxBackdoor.registerActionHandler('set-mock-time', ({ time }) => this.setNow(time));
  }

  // If you have a single instance through the app, you might not need this.
  dispose() {
    detoxBackdoor.removeActionHandler('set-mock-time');
  }

  setNow(time) {
    this.#now = time;
  }

  now() {
    return this.#now;
  }
}
```

In the mock implementation, `TimeService.e2e.js`, we're listening for `detoxBackdoor` actions with `set-mock-time` name and, when received, we adjust the internal `#now` value if the `action` is `"set-mock-time"`.

:::tip

- **One-at-a-Time:** Only a single action handler can be set per action name. Design your logic accordingly if you have multiple instances needing action handling.

- **Bidirectional flow:** Not supported yet, but planned for the future. Every action handler will be able to return a value back to the caller, which is why the limitation is in place.

- **Strict Mode (Default=On):** This throws errors upon accidental overwrites of handlers, or firing unknown backdoor actions. Although not recommended, you can disable this behavior by setting:

  ```js
  detoxBackdoor.strict = false;
  ```

- **Handle with Care:** Ensure your handlers do not throw unhandled exceptions. At the moment, Detox won’t report them back seamlessly to the test runner. If your app crashes, especially in _devRelease_ mode – read the crash message with attention before pointing fingers at Detox! :slightly_smiling_face:

:::

If you still would like to have multiple listeners for the same action, you can use the `detoxBackdoor.addActionListener` method instead:

```js
const listener = ({ time }) => console.log(`Received time: ${time}`);
detoxBackdoor.addActionListener('set-mock-time', listener);
detoxBackdoor.removeActionListener('set-mock-time', listener);
```

The weaker side of action listeners is that they will never be able to return a value back to the caller by design.

Now, when your app mocks are in place, you can open your Detox test file and instruct the app to use the mocked time service:

```js
await device.backdoor({
  action: "set-mock-time",
  time: 1672531199000,
});
```

Summarizing the above, Backdoor API enables your tests to directly "speak" to your app, altering its state without UI interaction.

:::danger Security Notice

Avoid using `detoxBackdoor` in your production code, as it might expose a security vulnerability.

Leave these action handlers to **mock files only**, and make sure they are excluded from the public release builds.
Backdoor API is a **testing tool**, and it should be isolated to test environments only.

:::

Provided that your app is designed with testability in mind, Backdoor API can be a powerful tool for testing cases where native tools fall short:
changing the internal clock, simulating network conditions, geolocation, quick authentication, and more.

Use it wisely, and... happy Detoxing!
