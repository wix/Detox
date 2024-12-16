const { androidBaseAppConfig } = require('./detox.config-android');

const launchArgs = {
  app: 'le',
  goo: 'gle?',
  micro: 'soft',
};

/** @type {Detox.DetoxConfig} */
const config = {
  extends: 'detox-allure2-adapter/preset-detox',
  testRunner: {
    args: {
      $0: process.env.CI ? 'nyc jest' : 'jest',
      config: 'e2e/jest.config.js',
      forceExit: process.env.CI ? true : undefined,
      _: ['e2e/'],
    },
    detached: !!process.env.CI,
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
        keepOnlyFailedTestsArtifacts: false,
      },
    },
  },

  apps: {
    'ios.debug': {
      type: 'ios.app',
      name: 'example',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/example.app',
      build: 'set -o pipefail && xcodebuild -workspace ios/example.xcworkspace -scheme example-ci -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build -quiet',
      start: 'react-native start',
      bundleId: 'com.wix.detox-example',
    },

    'ios.release': {
      type: 'ios.app',
      name: 'example',
      binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/example.app',
      build: 'set -o pipefail && export CODE_SIGNING_REQUIRED=NO && export RCT_NO_LAUNCH_PACKAGER=true && xcodebuild -workspace ios/example.xcworkspace -scheme example-ci -configuration Release -sdk iphonesimulator -derivedDataPath ios/build -quiet',
    },

    'android.debug': {
      ...androidBaseAppConfig('debug'),
      name: 'example',
      start: 'react-native start',
      reversePorts: [8081],
    },

    'android.debug.withArgs': {
      ...androidBaseAppConfig('debug'),
      name: 'exampleWithArgs',
      build: ':',
      reversePorts: [8081],
      launchArgs,
    },

    'android.release': {
      ...androidBaseAppConfig('release'),
      name: 'example',
    },

    'android.release.withArgs': {
      ...androidBaseAppConfig('release'),
      name: 'exampleWithArgs',
      build: ':',
      launchArgs,
    },
  },

  devices: {
    'ios.simulator': {
      type: 'ios.simulator',
      headless: Boolean(process.env.CI),
      device: {
        type: 'iPhone 15 Pro Max',
        os: '17.0.1'
      },
    },

    'android.emulator': {
      type: 'android.emulator',
      headless: Boolean(process.env.CI),
      gpuMode: process.env.CI ? 'off' : undefined,
      device: {
        avdName: 'Pixel_3a_API_34'
      },
      utilBinaryPaths: ["e2e/util-binary/detoxbutler-1.0.4-aosp-release.apk"]
    },

    'android.attached': {
      type: 'android.attached',
      device: {
        adbName: '.*'
      },
    },

    'android.genycloud.uuid': {
      type: 'android.genycloud',
      device: {
        recipeUUID: '9baf12f9-a645-4ffa-a688-0e92584d6194',
      },
      utilBinaryPaths: ["e2e/util-binary/detoxbutler-1.0.4-genymotion-release.apk"]
    },

    'android.genycloud.name': {
      type: 'android.genycloud',
      device: {
        recipeName: 'Detox_Pixel_3a_API_34',
      },
      utilBinaryPaths: ["e2e/util-binary/detoxbutler-1.0.4-genymotion-release.apk"]
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
    'android.emu.release': {
      device: 'android.emulator',
      apps: ['android.release', 'android.release.withArgs'],
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
