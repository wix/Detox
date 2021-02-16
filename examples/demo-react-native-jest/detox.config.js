module.exports = {
  "testRunner": "jest",
  "runnerConfig": process.env.DETOX_EXPOSE_GLOBALS === '0' ? 'e2eExplicitRequire/config.json' : 'e2e/config.json',
  "specs": process.env.DETOX_EXPOSE_GLOBALS === '0' ? 'e2eExplicitRequire' : 'e2e',
  "behavior": {
    "init": {
      "exposeGlobals": process.env.DETOX_EXPOSE_GLOBALS === '0' ? false : true,
    },
  },
  "apps": {
    "ios.release": {
      "type": "ios.app",
      "binaryPath": "../demo-react-native/ios/build/Build/Products/Release-iphonesimulator/example.app",
    },
    "android.release": {
      "type": "android.apk",
      "binaryPath": "../demo-react-native/android/app/build/outputs/apk/release/app-release.apk",
    }
  },
  "devices": {
    "simulator": {
      "type": "ios.simulator",
      "device": {
        "type": "iPhone 11 Pro"
      }
    },
    "emulator": {
      "type": "android.emulator",
      "device": {
        "avdName": "Pixel_API_28"
      }
    }
  },
  "configurations": {
    "ios.sim.release": {
      "device": "simulator",
      "app": "ios.release",
      "artifacts": {
        // Do not use in your projects unless you really need custom paths.
        // This section serves just as an example that you can locally override
        // some artifacts, behavior and session settings

        "pathBuilder": "./e2e/detox.pathbuilder.ios.js"
      }
    },
    "android.emu.release": {
      "device": "emulator",
      "app": "android.release",
      "artifacts": {
        // Do not use in your projects unless you really need custom paths.
        // This section serves just as an example that you can locally override
        // some artifacts, behavior and session settings

        "pathBuilder": "./e2e/detox.pathbuilder.android.js"
      }
    }
  }
};
