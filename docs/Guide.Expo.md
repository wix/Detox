---
id: Guide.Expo
title: Expo
---

## Usage with Expo (iOS)

- Install `detox` and `detox-expo-helpers` (yarn or npm)
- Add `detox` configuration to [package.json](https://github.com/expo/with-detox-tests/blob/master/package.json#L21-L29):

```es6
"detox": {
  "configurations": {
    "ios.sim": {
      "binaryPath": "bin/Exponent.app",
      "type": "ios.simulator",
      "name": "iPhone 7"
    }
  }
}
```

- Download the Expo app from [Expo.io/tools](https://expo.io/tools).
- Unzip the iOS IPA and **rename the folder** to `Exponent.app`. It'll have a file icon but will still be a folder.
- Create `bin` folder in your project and put `Exponent.app` inside so it matches the binaryPath you set above.
- Create an `e2e` and copy over the settings from [the example app](https://github.com/expo/with-detox-tests/tree/master/e2e)

The most important piece of this the `reloadApp` from `detox-expo-helpers`. Don't forget this.

```es6
const { reloadApp } = require('detox-expo-helpers');
// ...
beforeEach(async () => {
  await reloadApp();
});
```

That's it! The rest of what you do should be similar to normal detox settings. If you have questions, [tweet @peterpme](https://twitter.com/peterpme)

## Usage with Expo (Android)

- We haven't personally tried getting this to work on Android. If you have, feel free to open up a PR!

### Example App
The [example app](https://github.com/expo/with-detox-tests) is outdated but the code is exactly the same. I have a PR open that'll make it runnable again.
