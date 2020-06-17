module.exports = {
  "testRunner": "jest",
  "runnerConfig": process.env.DETOX_EXPOSE_GLOBALS === '0' ? 'e2eExplicitRequire/config.json' : 'e2e/config.json',
  "specs": process.env.DETOX_EXPOSE_GLOBALS === '0' ? 'e2eExplicitRequire' : 'e2e',
  "behavior": {
    "init": {
      "exposeGlobals": process.env.DETOX_EXPOSE_GLOBALS === '0' ? false : true,
    },
  },
  "configurations": {
    "ios.sim.release": {
      "type": "ios.simulator",
      "binaryPath": "../demo-react-native/ios/build/Build/Products/Release-iphonesimulator/example.app",
      "device": {
          "type": "iPhone 11 Pro"
      },
      "artifacts": {
        "pathBuilder": "./e2e/detox.pathbuilder.ios.js"
      }
    },
    "android.emu.release": {
      "type": "android.emulator",
      "binaryPath": "../demo-react-native/android/app/build/outputs/apk/release/app-release.apk",
      "device": {
          "avdName": "Pixel_API_28"
      },
      "artifacts": {
        "pathBuilder": "./e2e/detox.pathbuilder.android.js"
      }
    }
  }
};
