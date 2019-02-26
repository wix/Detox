---
id: Guide.Expo
title: Expo
---

## Usage with Expo (iOS)

- Install `detox` 9.0.6 or higher, `detox-expo-helpers` and `expo-detox-hook` (yarn or npm)
- Go through the [Getting Started](https://github.com/wix/Detox/blob/master/docs/Introduction.GettingStarted.md) through step 3. 
- Replace `detox.configurations` in [package.json](https://github.com/expo/with-detox-tests/blob/master/package.json#L21-L29) with this: 

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

- Download your Expo Client iOS App from [Expo.io/builds](https://expo.io/builds).

- Unzip the iOS IPA and **rename the folder** to `Exponent.app`. It'll have a file icon but will still be a folder.
- Create `bin` folder and put `Exponent.app` inside so it matches the binaryPath set above.
- In the `e2e` folder, copy over the settings from [the example app](https://github.com/expo/with-detox-tests/tree/master/e2e)

The most important piece of this the `reloadApp` from `detox-expo-helpers`. Don't forget this.

```es6
const { reloadApp } = require('detox-expo-helpers');
// ...
beforeEach(async () => {
  await reloadApp();
});
```

## Usage with Expo (Android)

- Usage with Android is currently TBD.

### Example App
[expo/with-detox-tests](https://github.com/expo/with-detox-tests)
