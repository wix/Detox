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
  configurations: {
    "ios.sim.debug": {
      binaryPath: "ios/build/Build/Products/Debug-iphonesimulator/example.app",
      build: "set -o pipefail && xcodebuild -workspace ios/example.xcworkspace -UseNewBuildSystem=NO -scheme example_ci -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build -quiet",
      type: "ios.simulator",
      device: {
        type: "iPhone 12 Pro Max"
      }
    },
    "ios.sim.release": {
      binaryPath: "ios/build/Build/Products/Release-iphonesimulator/example.app",
      build: "set -o pipefail && export CODE_SIGNING_REQUIRED=NO && export RCT_NO_LAUNCH_PACKAGER=true && xcodebuild -workspace ios/example.xcworkspace -UseNewBuildSystem=NO -scheme example_ci -configuration Release -sdk iphonesimulator -derivedDataPath ios/build -quiet",
      type: "ios.simulator",
      device: {
        type: "iPhone 12 Pro Max"
      },
      session: {
        debugSynchronization: 3000
      }
    },
    "ios.none": {
      binaryPath: "ios",
      type: "ios.none",
      device: {
        type: "iPhone 12 Pro Max"
      },
      session: {
        server: "ws://localhost:8099",
        sessionId: "com.wix.detox-example"
      }
    },
    "ios.manual": {
      type: "ios.simulator",
      binaryPath: "ios/build/Build/Products/Debug-iphonesimulator/example.app",
      artifacts: false,
      behavior: {
        launchApp: "manual"
      },
      device: {
        type: "iPhone 11 Pro"
      },
      session: {
        autoStart: true,
        server: "ws://localhost:8099",
        sessionId: "com.wix.detox-example"
      }
    },
    "android.manual": {
      binaryPath: "android/app/build/outputs/apk/fromBin/debug/app-fromBin-debug.apk",
      build: ":",
      type: "android.emulator",
      artifacts: false,
      device: {
        avdName: "Pixel_API_28"
      },
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
      type: "android.emulator",
      device: {
        avdName: "Pixel_API_28"
      }
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
      binaryPath: "android/app/build/outputs/apk/fromBin/release/app-fromBin-release.apk",
      build: "cd android && ./gradlew assembleFromBinRelease assembleFromBinReleaseAndroidTest -DtestBuildType=release && cd ..",
      type: "android.genycloud",
      device: {
        recipeUUID: "a50a71d6-da90-4c67-bdfa-5b602b0bbd15"
      }
    },
    "android.genycloud.release2": {
      binaryPath: "android/app/build/outputs/apk/fromBin/release/app-fromBin-release.apk",
      build: "cd android && ./gradlew assembleFromBinRelease assembleFromBinReleaseAndroidTest -DtestBuildType=release && cd ..",
      type: "android.genycloud",
      device: {
        recipeName: "Detox_Pixel_API_29"
      }
    },
    "android.emu.debug.fromSource": {
      binaryPath: "android/app/build/outputs/apk/fromSource/debug/app-fromSource-debug.apk",
      utilBinaryPaths: [
        "./cache/test-butler-app.apk"
      ],
      build: "cd android && ./gradlew assembleFromSourceDebug assembleFromSourceDebugAndroidTest -DtestBuildType=debug && cd ..",
      type: "android.emulator",
      device: {
        avdName: "Pixel_API_28"
      }
    },
    stub: {
      type: "./integration/stub",
      name: "integration-stub",
      device: {
        integ: "stub"
      }
    }
  }
};
