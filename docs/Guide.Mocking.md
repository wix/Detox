# Mocking

Mocking is an important part of testing. You may want to alter some behavior of your app during test and replace it with a mock. Here are some example reasons why this could be useful:

* Change server endpoints to point to a mock/staging server instead of the regular production server
* Stub a feature the simulator doesn't support
* Prepare mock environment data like GPS position, Contacts/Photos found on the device, etc

Note that mocking in end-to-end tests like in Detox is very different from mocking in unit tests like in Jest. With unit tests, the mocks can change between test case to test case. With Detox, remember that we're building the app once before all tests start. This means that mocks cannot be replaced between test cases. We'll have to assume our mock remains static during all test cases.

We'll only concentrate on mocking by changing JavaScript files under React Native apps.

[`react-native-repackager`](https://github.com/wix/react-native-repackager) extends React Native packager’s ability to override JavaScript files with different extensions. Just like you can create `myFile.ios.js` and `myFile.android.js`, you'll be able to create `myFile.e2e.js` that will take over during Detox tests. This even works under `node_modules` which means we can publish libraries that contain ready-made mock implementations.

This replacement mechanism provides a lot of flexibility to change implementations for testing without affecting your production code. For more information and detailed usage instructions, [read the docs](https://github.com/wix/react-native-repackager/blob/master/README.md).

**Note:** Repackager is available for RN 0.44 and 0.51. It is natively supported in RN 0.55 an up.


### Usage

#### Configuration
0. For RN < 0.55, setup `react-native-repackager` in your library.
1. For case 0.55 <= RN < 0.59 create a file called `rn-cli.config.js` in the root folder. If you use RN >= 0.59 (which in turn uses Metro with breaking changes introduced in 0.43 - https://github.com/facebook/metro/releases/tag/v0.43.0) file should have name `metro.config.js` or `metro.config.json` (or define metro field in `package.json`) to root dir. Then set up `resolver.sourceExts` to prioritize any given source extension over the default one:

    ```js
    const defaultSourceExts = require('metro-config/src/defaults/defaults').sourceExts
    module.exports = {
      resolver: { 
        sourceExts: process.env.RN_SRC_EXT
                    ? process.env.RN_SRC_EXT.split(',').concat(defaultSourceExts)
                    : defaultSourceExts
      }
    };
    ```
    
    or if you have RN < 0.57 or Metro < 0.43 use the old Metro configuration format:
    
     ```js
    module.exports = {
      getSourceExts: () => process.env.RN_SRC_EXT ? 
                           process.env.RN_SRC_EXT.split(',') : []
    };

     ```

2. Create `anyfile.e2e.js` alongside `anyfile.js`



#### Triggering 
Whenever Metro runs with `RN_SRC_EXT` environment variable set, it will override the default files with the the ones set in `RN_SRC_EXT`.

```bash
> RN_SRC_EXT=e2e.js react-native start
> RN_SRC_EXT=e2e.js xcodebuild <params>
> RN_SRC_EXT=e2e.js ./gradlew assembleRelease
```

#### Example of how to mock a module
If you want to mock a module, here is an example of how to do it: 
1. Follow the steps above in the [Configuration](#Configuration) section
2. Create a file that just imports the module, `YourNativeModuleProvider.js`, containing:
```js

import { NativeModules } from 'react-native';

export const { YourNativeModule } = NativeModules;

```
3. Create a file on the same directory - `YourNativeModuleProvider.e2e.js`, containing:
```js
// You can add a console.log here so it shows on your react-native console:
console.log('We are now using our mocked NativeModule')

const YourNativeModule = {
  mockedFunctionCall: () => 'Do something'
}
export { YourNativeModule };
```
4. Run Metro using the information in [Triggering](#Triggering)
5. On your simulator, enable debug mode and you should see "We are now using our mocked NativeModule"
