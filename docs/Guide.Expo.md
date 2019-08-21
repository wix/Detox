# Expo

> **Note**: Expo support is entirely a community driven effort. We do not use Expo internally and, unfortunately, do not have the resources to actively support it.

### Usage with Expo (iOS)

- Install `detox` 9.0.6 or higher, `detox-expo-helpers` and `expo-detox-hook` (yarn or npm)
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

- Download the Expo Client iOS App from [Expo.io/tools](https://expo.io/tools#client).
- Unzip the iOS IPA and **rename the folder** to `Exponent.app`. It'll have a file icon but will still be a folder.
- Create `bin` folder and put `Exponent.app` inside so it matches the binaryPath set above.
- Create an `e2e` and copy over the settings from [the example app](https://github.com/expo/with-detox-tests/tree/master/e2e)

The most important piece of this the `reloadApp` from `detox-expo-helpers`. Don't forget this.

```es6
const { reloadApp } = require('detox-expo-helpers');
// ...
beforeEach(async () => {
  await reloadApp();
});
```

### Usage with Expo (Android)

- Usage with Android is currently TBD.

### Known issues
[Timeout on opening the app](https://github.com/wix/Detox/issues/1422) - Expo not working with detox > 12.3.0

### Example App
[yaron1m/expo-detox-typescript-example](https://github.com/yaron1m/expo-detox-typescript-example)
