module.exports = {
  "test-runner": "mocha",
  "runner-config": "e2e/.mocharc.json",
  "specs": process.env.DETOX_EXPOSE_GLOBALS === '0' ? 'e2eExplicitRequire' : 'e2e',
  "behavior": {
    "init": {
      "exposeGlobals": process.env.DETOX_EXPOSE_GLOBALS === '0' ? false : true,
    },
  },
  "configurations": {
    "ios.sim.release": {
      "binaryPath": "ios/build/Build/Products/Release-iphonesimulator/example.app",
      "build": "export RCT_NO_LAUNCH_PACKAGER=true && xcodebuild -project ios/example.xcodeproj -UseNewBuildSystem=NO -scheme example -configuration Release -sdk iphonesimulator -derivedDataPath ios/build -quiet",
      "type": "ios.simulator",
      "device": {
        "type": "iPhone 11 Pro"
      }
    },
    "ios.sim.debug": {
      "binaryPath": "ios/build/Build/Products/Debug-iphonesimulator/example.app",
      "build": "xcodebuild -project ios/example.xcodeproj -UseNewBuildSystem=NO -scheme example -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build",
      "type": "ios.simulator",
      "device": {
        "type": "iPhone 11 Pro"
      }
    },
    "ios.none": {
      "binaryPath": "ios/build/Build/Products/Debug-iphonesimulator/example.app",
      "build": "xcodebuild -project ios/example.xcodeproj -UseNewBuildSystem=NO -scheme example -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build",
      "type": "ios.none",
      "device": {
        "type": "iPhone 11 Pro"
      },
      "session": {
        "server": "ws://localhost:8099",
        "sessionId": "com.wix.demo.react.native"
      }
    },
    "android.emu.debug": {
      "binaryPath": "android/app/build/outputs/apk/debug/app-debug.apk",
      "build": "cd android ; ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug ; cd -",
      "type": "android.emulator",
      "device": {
        "avdName": "Pixel_API_28"
      }
    },
    "android.emu.release": {
      "binaryPath": "android/app/build/outputs/apk/release/app-release.apk",
      "build": "cd android ; ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release ; cd -",
      "type": "android.emulator",
      "device": {
        "avdName": "Pixel_API_28"
      }
    },
    "android.att.release": {
      "binaryPath": "android/app/build/outputs/apk/release/app-release.apk",
      "build": "cd android ; ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release ; cd -",
      "type": "android.attached",
      "device": {
        "adbName": "emulator-.*"
      }
    }
  }
};
