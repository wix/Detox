---
id: Guide.TypeScriptJest
title: Integrating TypeScript with Detox + Jest
---

## Usage

### 0. Initialize Detox in your project

After following the [Getting Started](Introduction.GettingStarted.md) Guide to set up Detox + Jest, we will make some changes to your project:

- Remove Detox from `package.json` at the root level: `npm uninstall detox`
- Create a `package.json` in the `e2e` folder and add Detox and Jest to the project dependencies:

```sh
cd e2e
npm init -y
npm install -D detox jest
```

You should then move the settings for Detox from the root-level `package.json` to the `e2e/package.json`, but make sure that you update the `build`, `binaryPath`, and `runner-config` values for your Detox configurations:

```json
{
  // ...
  "detox": {
    "runner-config": "./config.json",
    "configurations": {
      "ios.sim.debug": {
        "binaryPath": "../ios/build/Build/Products/Debug-iphonesimulator/YourAppName.app",
        "build": "xcodebuild -project ../ios/YourAppName.xcodeproj -scheme YourAppName -configuration Debug -sdk iphonesimulator -derivedDataPath ../ios/build",
        "type": "ios.simulator",
        "name": "iPhone X"
      },
      "android.emu.debug": {
        "binaryPath": "../android/app/build/outputs/apk/debug/app-debug.apk",
        "build": "cd ../android; ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug; cd ../e2e",
        "type": "android.emulator",
        "name": "Pixel_2_API_27"
      },
      "android.emu.release": {
        "binaryPath": "../android/app/build/outputs/apk/release/app-release.apk",
        "build": "cd ../android; ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release; cd ../e2e",
        "type": "android.emulator",
        "name": "Pixel_2_API_27"
      }
    }
  }
}
```

- Edit `init.js` to `require` the Detox configuration from `e2e/package.json` instead of the root-level `package.json`

```js
const config = require('./package.json').detox;
```

Moving all Detox-related code into the `e2e` directory is necessary to prevent a typing collision issue with Jest and Detox (see step 5).

Before moving on, make sure that you can still successfully run your Detox tests.

### 1. Add TypeScript + `ts-jest` to `e2e/package.json`

```sh
npm install --save-dev typescript ts-jest
```

### 2. Configure Jest to use `ts-jest`

Modify your Jest configuration (`e2e/config.json` by default) to include the following properties

```json
{
  "preset": "ts-jest",
  "testEnvironment": "node",
  "setupTestFrameworkScriptFile": "./init.ts"
}
```

NB: this is mostly the same output of running `ts-jest config:init`, with `setupTestFrameworkScriptFile` being the only added property.

### 3. `.js` -> `.ts`

Convert all files in the `e2e` directory ending in `.js` to `.ts`

### 4. Add typings for Detox, Jest, and Jasmine

Add typings for Detox, Jest, and Jasmine (the latter two are used in `init.ts`), as well as for other modules that you use in your Detox tests.

```sh
npm install --save-dev @types/detox @types/jest @types/jasmine
```

Note: [`@types/detox`](https://www.npmjs.com/package/@types/detox) is maintained by the community and not by Wix.

You should now be able to run your Detox tests, written in TypeScript! If you're not writing your unit tests with TypeScript and Jest, you can skip the next section.

### 5. Unit test collisions

Detox overrides certain global members that were defined by Jest (such as `expect`), which means that their typings collide and will cause compiler errors if you try to use them in the same project. This means that we need to set up TypeScript to ignore Detox when compiling our unit tests, which isn't straightforward since the default type-lookup behavior of TypeScript [will automatically include typings from `node_modules` under the root directory](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html#types-typeroots-and-types) (i.e. `e2e/node_modules`). Therefore, we'll set the main `tsconfig.json` to ignore typings within the `e2e/node_modules/@types` directory, and only consider typings in the root-level `node_modules`, while `e2e/tsconfig.json` will include types from both the `e2e` and root directory `node_modules`:

```json
{
  // tsconfig.json
  "compilerOptions": {
    "typeRoots": ["node_modules/@types"]
  }
}
```

```json
{
  // e2e/tsconfig.json
  "compilerOptions": {
    "typeRoots": ["node_modules/@types", "../node_modules/@types"]
  }
}
```

With those `typeRoots` settings, you should now be able to run both your unit tests and Detox tests successfully and with no compiler errors.
