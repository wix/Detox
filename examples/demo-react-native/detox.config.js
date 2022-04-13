module.exports = {
  "specs": process.env.DETOX_EXPOSE_GLOBALS === '0' ? 'e2eExplicitRequire' : 'e2e',
  "behavior": {
    "init": {
      "exposeGlobals": process.env.DETOX_EXPOSE_GLOBALS === '0' ? false : true,
    },
  },
  "apps": {
    "ios.release": {
      "type": "ios.app",
      "binaryPath": "ios/build/Build/Products/Release-iphonesimulator/example.app",
      "build": "export RCT_NO_LAUNCH_PACKAGER=true && xcodebuild -workspace ios/example.xcworkspace -UseNewBuildSystem=NO -scheme example -configuration Release -sdk iphonesimulator -derivedDataPath ios/build -quiet"
    },
    "ios.debug": {
      "type": "ios.app",
      "binaryPath": "ios/build/Build/Products/Debug-iphonesimulator/example.app",
      "build": "xcodebuild -workspace ios/example.xcworkspace -UseNewBuildSystem=NO -scheme example -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build"
    },
    "android.debug": {
      "type": "android.apk",
      "binaryPath": "android/app/build/outputs/apk/debug/app-debug.apk",
      "build": "cd android ; ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug ; cd -"
    },
    "android.release": {
      "type": "android.apk",
      "binaryPath": "android/app/build/outputs/apk/release/app-release.apk",
      "build": "cd android ; ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release ; cd -"
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
      "app": "ios.release"
    },
    "ios.sim.debug": {
      "device": "simulator",
      "app": "ios.debug"
    },
    "ios.none": {
      "type": "ios.none",
      "session": {
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
