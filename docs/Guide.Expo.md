---
id: Guide.Expo
title: Expo
---

## Usage with Expo

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

- Download the Expo app from [Expo.io/tools](https://expo.io/tools). As of 03/19/18
  - [iOS IPA 2.3.0](https://dpq5q02fu5f55.cloudfront.net/Exponent-2.3.0.tar.gz)
  - [Android APK 2.3.2](https://d1ahtucjixef4r.cloudfront.net/Exponent-2.3.2.apk)

- Unzip the iOS IPA and **rename the folder** to `Exponent.app` (it'll now be a file and not a folder)
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

### Example App
The [example app](https://github.com/expo/with-detox-tests) is outdated but the code is exactly the same. I have a PR open that'll make it runnable again.
