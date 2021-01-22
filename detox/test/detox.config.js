/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: "nyc jest",
  runnerConfig: "e2e/config.js",
  specs: "e2e/*.test.js",
  behavior: {
    init: {
      exposeGlobals: true
    },
    cleanup: {
      shutdownDevice: false
    }
  },

  __session: {
    server: "ws://localhost:8099",
    sessionId: "test"
  },

  artifacts: {
    plugins: {
      log: "all",
      screenshot: {
        shouldTakeAutomaticSnapshots: true,
        takeWhen: {}
      },
      timeline: "all",
      uiHierarchy: "enabled"
    }
  },

  apps: {
    "ios.debug": {
      type: "ios.app",
      name: "example",
      binaryPath: "ios/build/Build/Products/Debug-iphonesimulator/example.app",
      build: "set -o pipefail && xcodebuild -workspace ios/example.xcworkspace -UseNewBuildSystem=NO -scheme example_ci -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build -quiet",
      bundleId: "com.wix.detox-example",
    },

    "ios.release": {
      type: "ios.app",
      name: "example",
      binaryPath: "ios/build/Build/Products/Release-iphonesimulator/example.app",
      build: "set -o pipefail && export CODE_SIGNING_REQUIRED=NO && export RCT_NO_LAUNCH_PACKAGER=true && xcodebuild -workspace ios/example.xcworkspace -UseNewBuildSystem=NO -scheme example_ci -configuration Release -sdk iphonesimulator -derivedDataPath ios/build -quiet",
    },

    "android.debug": {
      type: "android.apk",
      binaryPath: "android/app/build/outputs/apk/fromBin/debug/app-fromBin-debug.apk",
      build: ":",
    },

    "android.fromSource": {
      type: "android.apk",
      binaryPath: "android/app/build/outputs/apk/fromSource/debug/app-fromSource-debug.apk",
      utilBinaryPaths: [
        "./cache/test-butler-app.apk"
      ],
      build: "cd android && ./gradlew assembleFromSourceDebug assembleFromSourceDebugAndroidTest -DtestBuildType=debug && cd ..",
    },

    "android.release": {
      type: "android.apk",
      binaryPath: "android/app/build/outputs/apk/fromBin/release/app-fromBin-release.apk",
      build: "cd android && ./gradlew assembleFromBinRelease assembleFromBinReleaseAndroidTest -DtestBuildType=release && cd ..",
    },
  },

  devices: {
    "ios.simulator": {
      type: "ios.simulator",
      device: {
        type: "iPhone 12 Pro Max"
      },
    },

    "android.emulator": {
      type: "android.emulator",
      device: {
        avdName: "Pixel_API_28"
      }
    },

    "android.genycloud.uuid": {
      type: "android.genycloud",
      device: {
        recipeUUID: "a50a71d6-da90-4c67-bdfa-5b602b0bbd15",
      },
    },

    "android.genycloud.name": {
      type: "android.genycloud",
      device: {
        recipeName: "Detox_Pixel_API_29",
      },
    },
  },

  configurations: {
    "ios.none": {
      type: "ios.none",
      session: {
        server: "ws://localhost:8099",
        sessionId: "com.wix.detox-example"
      }
    },
    "ios.sim.debug": {
      device: "ios.simulator",
      apps: ["ios.debug"],
    },
    "ios.sim.release": {
      device: "ios.simulator",
      apps: ["ios.release"],
      session: {
        debugSynchronization: 3000,
      },
    },
    "ios.manual": {
      device: "ios.simulator",
      app: "ios.debug",
      artifacts: false,
      behavior: {
        launchApp: "manual"
      },
      session: {
        autoStart: true,
        server: "ws://localhost:8099",
        sessionId: "com.wix.detox-example"
      }
    },
    "android.manual": {
      device: "android.emulator",
      app: "android.debug",
      artifacts: false,
      behavior: {
        launchApp: "manual"
      },
      session: {
        autoStart: true,
        server: "ws://localhost:8099",
        sessionId: "test"
      }
    },
    "android.emu.debug": {
      binaryPath: "android/app/build/outputs/apk/fromBin/debug/app-fromBin-debug.apk",
      utilBinaryPaths: [
        "./cache/test-butler-app.apk"
      ],
      build: "cd android && ./gradlew assembleFromBinDebug assembleFromBinDebugAndroidTest -DtestBuildType=debug && cd ..",
    },
    "android.emu.release": {
      binaryPath: "android/app/build/outputs/apk/fromBin/release/app-fromBin-release.apk",
      utilBinaryPaths: [
        "./cache/test-butler-app.apk"
      ],
      build: "cd android && ./gradlew assembleFromBinRelease assembleFromBinReleaseAndroidTest -DtestBuildType=release && cd ..",
      type: "android.emulator",
      device: {
        avdName: "Pixel_API_28"
      }
    },
    "android.genycloud.release": {
      device: "android.genycloud.uuid",
      app: "android.release",
    },
    "android.genycloud.release2": {
      device: "android.genycloud.name",
      app: "android.release",
    },
    "android.emu.debug.fromSource": {
      device: "android.emulator",
      app: "android.fromSource",
    },
    "stub": {
      type: "./integration/stub",
      name: "integration-stub",
      device: {
        integ: "stub"
      }
    }
  }
};
