const { androidBaseAppConfig } = require('./detox.config-android');

// The Detox Server that owns the simulators. Unset, `detox test` starts a
// local helper server on its own; `yarn parity` (scripts/parity.js) points
// the suite at the run's dedicated server instead.
const client = process.env.PARITY_SERVER_URL
  ? { server: process.env.PARITY_SERVER_URL, token: process.env.PARITY_SERVER_TOKEN }
  : {};

// Unset DETOX_IOS_OS: the newest runtime the server can create the model on.
const iosDevice = {
  type: process.env.DETOX_IOS_MODEL || 'iPhone 17 Pro',
  ...(process.env.DETOX_IOS_OS ? { os: process.env.DETOX_IOS_OS } : {}),
};

const launchArgs = {
  app: 'le',
  goo: 'gle?',
  micro: 'soft',
};

const config = {
  testRunner: {
    args: {
      $0: 'jest',
      config: 'e2e/jest.config.js',
      forceExit: process.env.CI ? true : undefined,
    },
  },

  client,

  behavior: {
    init: {
      exposeGlobals: true
    },
    cleanup: {
      shutdownDevice: false
    }
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
      arch: 'arm64',
    },

    'ios.release': {
      type: 'ios.app',
      name: 'example',
      binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/example.app',
      build: 'set -o pipefail && export CODE_SIGNING_REQUIRED=NO && export RCT_NO_LAUNCH_PACKAGER=true && xcodebuild -workspace ios/example.xcworkspace -scheme example-ci -configuration Release -sdk iphonesimulator -derivedDataPath ios/build -quiet',
      arch: 'arm64',
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
      device: iosDevice,
    },

    'android.emulator': {
      type: 'android.emulator',
      headless: Boolean(process.env.CI),
      device: {
        avdName: 'Pixel_3a_API_36'
      },
      utilBinaryPaths: ["e2e/util-binary/detoxbutler-1.1.0-aosp-release.apk"],
      systemUI: {
        extends: 'genymotion',
        pointerLocationBar: 'show',
        touches: 'show',
        navigationMode: '3-button',
        statusBar: {
          clock: '1948',
        },
      },
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
      utilBinaryPaths: ["e2e/util-binary/detoxbutler-1.1.0-genymotion-release.apk"]
    },

    'android.genycloud.name': {
      type: 'android.genycloud',
      device: {
        recipeName: 'Detox_Pixel_3a_API_34',
      },
      utilBinaryPaths: ["e2e/util-binary/detoxbutler-1.1.0-genymotion-release.apk"]
    },

    'android.genycloud.name-arm64': {
      type: 'android.genycloud',
      device: {
        recipeName: 'Detox_Pixel_3a_API_35',
      },
      utilBinaryPaths: ["e2e/util-binary/detoxbutler-1.1.0-genymotion-release.apk"]
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
      device: 'android.genycloud.uuid',
      apps: ['android.release', 'android.release.withArgs'],
    },
    'android.genycloud.release-arm64': {
      device: 'android.genycloud.name-arm64',
      apps: ['android.release', 'android.release.withArgs'],
    },
  }
};

module.exports = config;
