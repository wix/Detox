const launchArgs = {
  app: 'le',
  goo: 'gle?',
  micro: 'soft',
};

/** @type {Detox.DetoxConfig} */
const config = {
  logger: {
    level: process.env.CI ? 'debug' : undefined,
  },

  testRunner: {
    args: {
      $0: 'nyc jest',
      config: 'e2e/jest.config.js',
      _: ['e2e/']
    },
    retries: process.env.CI ? 1 : undefined,
    jest: {
      setupTimeout: +`${process.env.DETOX_JEST_SETUP_TIMEOUT || 300000}`,
      reportSpecs: process.env.CI ? true : undefined,
    },
  },

  behavior: {
    init: {
      exposeGlobals: true
    },
    cleanup: {
      shutdownDevice: false
    }
  },

  __session: {
    server: 'ws://localhost:8099',
    sessionId: 'test'
  },

  artifacts: {
    pathBuilder: process.env.DETOX_CUSTOM_PATH_BUILDER,
    plugins: {
      log: 'all',
      screenshot: {
        shouldTakeAutomaticSnapshots: true,
        takeWhen: {}
      },
      uiHierarchy: 'enabled'
    }
  },

  apps: {
    'ios.debug': {
      type: 'ios.app',
      name: 'example',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/example.app',
      build: 'set -o pipefail && xcodebuild -workspace ios/example.xcworkspace -UseNewBuildSystem=YES -scheme example_ci -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build -quiet',
      start: 'react-native start',
      bundleId: 'com.wix.detox-example',
    },

    'ios.release': {
      type: 'ios.app',
      name: 'example',
      binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/example.app',
      build: 'set -o pipefail && export CODE_SIGNING_REQUIRED=NO && export RCT_NO_LAUNCH_PACKAGER=true && xcodebuild -workspace ios/example.xcworkspace -UseNewBuildSystem=YES -scheme example_ci -configuration Release -sdk iphonesimulator -derivedDataPath ios/build -quiet',
    },

    'android.debug': {
      type: 'android.apk',
      name: 'example',
      binaryPath: 'android/app/build/outputs/apk/rnDefault/debug/app-rnDefault-debug.apk',
      build: 'cd android && ./gradlew assembleRnDefaultDebug assembleRnDefaultDebugAndroidTest -DtestBuildType=debug && cd ..',
      start: 'react-native start',
      reversePorts: [8081],
    },

    'android.debug.withArgs': {
      type: 'android.apk',
      name: 'exampleWithArgs',
      binaryPath: 'android/app/build/outputs/apk/rnDefault/debug/app-rnDefault-debug.apk',
      build: ':',
      reversePorts: [8081],
      launchArgs,
    },

    'android.release': {
      type: 'android.apk',
      name: 'example',
      binaryPath: 'android/app/build/outputs/apk/rnDefault/release/app-rnDefault-release.apk',
      build: 'cd android && ./gradlew assembleRnDefaultRelease assembleRnDefaultReleaseAndroidTest -DtestBuildType=release && cd ..',
    },

    'android.release.withArgs': {
      type: 'android.apk',
      name: 'exampleWithArgs',
      binaryPath: 'android/app/build/outputs/apk/rnDefault/release/app-rnDefault-release.apk',
      build: ':',
      launchArgs,
    },

    'android.debug.rnLegacy': {
      type: 'android.apk',
      name: 'example',
      binaryPath: 'android/app/build/outputs/apk/rnLegacy/debug/app-rnLegacy-debug.apk',
      build: 'cd android && ./gradlew assembleRnLegacyDebug assembleRnLegacyDebugAndroidTest -DtestBuildType=debug && cd ..',
      start: 'react-native start',
      reversePorts: [8081],
    },

    'android.debug.rnLegacy.withArgs': {
      type: 'android.apk',
      name: 'exampleWithArgs',
      binaryPath: 'android/app/build/outputs/apk/rnLegacy/debug/app-rnLegacy-debug.apk',
      build: ':',
      reversePorts: [8081],
      launchArgs,
    },

    'android.release.rnLegacy': {
      type: 'android.apk',
      name: 'example',
      binaryPath: 'android/app/build/outputs/apk/rnLegacy/release/app-rnLegacy-release.apk',
      build: 'cd android && ./gradlew assembleRnLegacyRelease assembleRnLegacyReleaseAndroidTest -DtestBuildType=release && cd ..',
    },

    'android.release.rnLegacy.withArgs': {
      type: 'android.apk',
      name: 'exampleWithArgs',
      binaryPath: 'android/app/build/outputs/apk/rnLegacy/release/app-rnLegacy-release.apk',
      build: ':',
      launchArgs,
    },
  },

  devices: {
    'ios.simulator': {
      type: 'ios.simulator',
      headless: Boolean(process.env.CI),
      device: {
        type: 'iPhone 12 Pro Max',
      },
    },

    'android.emulator': {
      type: 'android.emulator',
      headless: Boolean(process.env.CI),
      gpuMode: process.env.CI ? 'off' : undefined,
      device: {
        avdName: 'Pixel_3A_API_29'
      },
    },

    'android.genycloud.uuid': {
      type: 'android.genycloud',
      device: {
        recipeUUID: '90450ce0-cdd8-4229-8618-18a1fc195b62',
      },
    },

    'android.genycloud.name': {
      type: 'android.genycloud',
      device: {
        recipeName: 'Detox_Pixel_3A_API_29',
      },
    },
  },

  configurations: {
    'ios.sim.debug': {
      device: 'ios.simulator',
      app: 'ios.debug',
    },
    'ios.sim.release': {
      device: 'ios.simulator',
      app: 'ios.release',
      session: {
        debugSynchronization: 3000,
      },
    },
    'ios.manual': {
      device: 'ios.simulator',
      app: 'ios.debug',
      artifacts: false,
      behavior: {
        launchApp: 'manual'
      },
      session: {
        autoStart: true,
        server: 'ws://localhost:8099',
        sessionId: 'com.wix.detox-example'
      }
    },
    'android.manual': {
      device: 'android.emulator',
      apps: ['android.debug', 'android.debug.withArgs'],
      artifacts: false,
      behavior: {
        launchApp: 'manual'
      },
      session: {
        autoStart: true,
        server: 'ws://localhost:8099',
        sessionId: 'test'
      }
    },
    'android.emu.debug': {
      device: 'android.emulator',
      apps: ['android.debug', 'android.debug.withArgs'],
    },
    'android.emu.debug.rnLegacy': {
      device: 'android.emulator',
      apps: ['android.debug.rnLegacy', 'android.debug.rnLegacy.withArgs'],
    },
    'android.emu.release': {
      device: 'android.emulator',
      apps: ['android.release', 'android.release.withArgs'],
    },
    'android.emu.release.rnLegacy': {
      device: 'android.emulator',
      apps: ['android.release.rnLegacy', 'android.release.rnLegacy.withArgs'],
    },
    'android.genycloud.debug': {
      device: 'android.genycloud.uuid',
      apps: ['android.debug'],
    },
    'android.genycloud.release': {
      device: 'android.genycloud.uuid',
      apps: ['android.release', 'android.release.withArgs'],
    },
    'android.genycloud.release2': {
      device: 'android.genycloud.name',
      apps: ['android.release', 'android.release.withArgs'],
    },
    'android.genycloud.release.rnLegacy': {
      device: 'android.genycloud.uuid',
      apps: ['android.release.rnLegacy', 'android.release.rnLegacy.withArgs'],
    },
    'stub': {
      device: {
        type: './integration/stub',
        integ: 'stub'
      },
      app: {
        name: 'example'
      }
    }
  }
};

module.exports = config;
