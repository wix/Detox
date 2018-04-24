---
id: Guide.Mocking
title: Mocking
---

# Mocking 

Mocking is an important part of testing. You may want to alter some behavior of your app during test and replace it with a mock. Here are some example reasons why this could be useful:

* Change server endpoints to point to a mock/staging server instead of the regular production server
* Stub a feature the simulator doesn't support
* Prepare mock environment data like GPS position, Contacts/Photos found on the device, etc

Note that mocking in end-to-end tests like in Detox is very different from mocking in unit tests like in Jest. With unit tests, the mocks can change between test case to test case. With Detox, remember that we're building the app once before all tests start. This means that mocks cannot be replaced between test cases. We'll have to assume our mock remains static during all test cases.

We'll only concentrate on mocking by changing JavaScript files under React Native apps.

[`react-native-repackager`](https://github.com/wix/react-native-repackager) extends React Native packager’s ability to override JavaScript files with different extensions. Just like you can create `myFile.ios.js` and `myFile.android.js`, you'll be able to create `myFile.e2e.js` that will take over during Detox tests. This even works under `node_modules` which means we can publish libraries that contain ready-made mock implementations.

This replacement mechanism provides a lot of flexibility to change implementations for testing without affecting your production code. For more information and detailed usage instructions, [read the docs](https://github.com/wix/react-native-repackager/blob/master/README.md).

**Note:** Repackager is available for RN 0.44 and 0.51. It is nativley supported in RN 0.55 an up.


### Usage

#### Configuration
0. For RN < 0.55, setup `react-native-repackager` in your library.
1. Configure Metro by creating `rn-cli.config.js` to root dir and setting `getSourceExts()` to prioritize any given source extension over the default one, by triggering each of these commands the bundler will take `e2e.js` over `.js`

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

