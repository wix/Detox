/** @type {Detox.DetoxConfig} */
const config = {
  logger: {
    level: process.env.CI ? 'debug' : undefined,
  },

  testRunner: {
    args: {
      $0: 'jest',
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

  artifacts: {
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
      binaryPath: "http://46.101.117.193/DetoxExample.zip",
      bundleId: 'com.wix.detox-example',
      build: 'set -o pipefail && export CODE_SIGNING_REQUIRED=NO && export RCT_NO_LAUNCH_PACKAGER=true && xcodebuild -workspace ios/example.xcworkspace -UseNewBuildSystem=YES -scheme example_ci -configuration Release -sdk iphonesimulator -derivedDataPath ios/build -quiet',
    },
  },

  devices: {
    'ios.simulator': {
      type: 'ios.simulator',
      headless: Boolean(process.env.CI),
      device: {
        type: 'iPhone 14 Pro Max',
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
        server: 'http://46.101.117.193:4444/wd/hub',
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
