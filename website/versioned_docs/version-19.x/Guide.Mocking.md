---
id: mocking
slug: guide/mocking
title: Mocking
sidebar_label: Mocking
---

## Mocking

> **NOTE: This article previously focused on the older React Native versions (`<0.59`), so if you need to access it, [follow this Git history link](https://github.com/wix/Detox/blob/01ad250fe4168502a57339b8bcab0ec5a5c89e4b/docs/Guide.Mocking.md).**

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

### Quick flow

1. Pick a module that you are going to mock, e.g.:

   ```js file=src/config.js
   // src/config.js

   export const SERVER_URL = 'https://production.mycompany.name/api';
   export const FETCH_TIMEOUT = 60000;
   ```

1. Create a mock module alongside, with an arbitrary extension (e.g. `.mock.js`):

   ```js file=src/config.js
   // src/config.mock.js

   export * from './config.js';

   // override the url from the original file:
   export const SERVER_URL = 'http://localhost:3000/api';
   ```

1. Stop your _Metro bundler_ if it has been already running, and run it again with the corresponding file extension override, e.g.:

   ```sh
   npx react-native start --sourceExts mock.js,js,json,ts,tsx
   ```

   This command is already enough to start your application in an altered mode, and you can start running your tests. Now, if some module imports `./src/config`, you tell _Metro bundler_ to prefer `./src/config.mock.js` over the plain `./src/config.js`, which means the consumer gets the mocked implementation.

> CAVEAT: whichever file extension you might take for the mock files – make sure you don’t accidentally "pick up" unforeseen file overrides from `node_modules/**/*.your-extension.js`!
> _Metro bundler_ does not limit itself to your project files only – applying those `--sourceExts` also affects the resolution of the `node_modules` content!

### Configuring Metro bundler

While the mentioned way is good enough for the **debug mode**, it falls short for the **release builds**. The problem is that the `--sourceExts` argument is supported only by `react-native start` command. Hence, you’d need a CLI-independent way to configure your Metro bundler, and that is patching your project's `metro.config.js`:

```diff
/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */
+const defaultSourceExts = require('metro-config/src/defaults/defaults').sourceExts;

 module.exports = {
+  resolver: {
+    sourceExts: process.env.MY_APP_MODE === 'mocked'
+        ? ['mock.js', ...defaultSourceExts]
+        : defaultSourceExts,
+  },
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

```sh
MY_APP_MODE=mocked npx react-native start
```

This principle stays the same for the **release mode**, although the build commands might differ depending on the platform and a specific script:

```sh
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

As you might have noticed, this tutorial has no direct connection to Detox itself, which is a correct observation.
The suggested mocking techniques are a part of the React Native world itself, so please consult the further resources:

- <https://facebook.github.io/metro/>
- <https://github.com/react-native-community/cli/blob/master/docs/commands.md>

Happy Detoxing!
