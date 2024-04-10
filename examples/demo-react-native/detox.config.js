/** @type {Detox.DetoxConfig} */
module.exports = {
  logger: {
    level: process.env.CI ? 'debug' : undefined,
  },
  testRunner: {
    args: {
      config: 'e2e/jest.config.js',
      maxWorkers: process.env.CI ? 2 : undefined,
      _: ['e2e']
    },
  },
  artifacts: {
    plugins: {
      log: process.env.CI ? 'failing' : undefined,
      screenshot: process.env.CI ? 'failing' : undefined,
    },
  },
  apps: {
    "ios.release": {
      "type": "ios.app",
      "binaryPath": "ios/build/Build/Products/Release-iphonesimulator/example.app",
      "build": "export RCT_NO_LAUNCH_PACKAGER=true && xcodebuild -workspace ios/example.xcworkspace -UseNewBuildSystem=NO -scheme example -configuration Release -sdk iphonesimulator -derivedDataPath ios/build -quiet",
    },
    "ios.debug": {
      "type": "ios.app",
      "binaryPath": "ios/build/Build/Products/Debug-iphonesimulator/example.app",
      "build": "xcodebuild -workspace ios/example.xcworkspace -UseNewBuildSystem=NO -scheme example -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build",
      "start": "scripts/start-rn.sh ios",
    },
    "android.debug": {
      "type": "android.apk",
      "binaryPath": "android/app/build/outputs/apk/debug/app-debug.apk",
      "build": "cd android ; ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug ; cd -",
      "start": "scripts/start-rn.sh android",
    },
    "android.release": {
      "type": "android.apk",
      "binaryPath": "android/app/build/outputs/apk/release/app-release.apk",
      "build": "cd android ; ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release ; cd -",
    }
  },
  devices: {
    simulator: {
      type: "ios.simulator",
      headless: Boolean(process.env.CI),
      device: {
        type: "iPhone 15 Pro Max",
        os: "17.0.1"
      }
    },
    emulator: {
      type: "android.emulator",
      headless: Boolean(process.env.CI),
      gpuMode: process.env.CI ? 'off' : undefined,
      device: {
        avdName: "Pixel_API_28"
      },
      utilBinaryPaths: [
        "./cache/test-butler-app.apk"
      ],
    },
    "genymotion.emulator.uuid": {
      type: "android.genycloud",
      device: {
        recipeUUID: "a50a71d6-da90-4c67-bdfa-5b602b0bbd15"
      },
      utilBinaryPaths: [
        "./cache/test-butler-app.apk"
      ],
    },
    "genymotion.emulator.name": {
      type: "android.genycloud",
      device: {
        recipeName: "Detox_Pixel_API_29"
      },
      utilBinaryPaths: [
        "./cache/test-butler-app.apk"
      ],
    }
  },
  configurations: {
    "ios.sim.release": {
      "device": "simulator",
      "app": "ios.release"
    },
    "ios.sim.debug": {
      "device": "simulator",
      "app": "ios.debug"
    },
    "ios.manual": {
      "type": "ios.manual",
      "behavior": {
        "launchApp": "manual"
      },
      "artifacts": false,
      "session": {
        "autoStart": true,
        "server": "ws://localhost:8099",
        "sessionId": "com.wix.demo.react.native"
      }
    },
    "android.emu.debug": {
      "device": "emulator",
      "app": "android.debug"
    },
    "android.emu.release": {
      "device": "emulator",
      "app": "android.release"
    }
  }
};
