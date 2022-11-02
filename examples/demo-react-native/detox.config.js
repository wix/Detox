module.exports = {
  testRunner: {
    args: {
      config: 'e2e/config.json',
      _: ['e2e']
    },
  },
  artifacts: {
    plugins: {
      log: process.env.CI ? 'failing' : undefined,
      screenshot: process.env.CI ? 'failing' : undefined,
    },
  },
  apps: {
    "ios.release": {
      type: "ios.app",
      binaryPath: "ios/build/Build/Products/Release-iphonesimulator/example.app",
    },
    "android.release": {
      type: "android.apk",
      binaryPath: "android/app/build/outputs/apk/release/app-release.apk",
    }
  },
  devices: {
    simulator: {
      type: "ios.simulator",
      headless: Boolean(process.env.CI),
      device: {
        type: "iPhone 12 Pro"
      }
    },
    emulator: {
      type: "android.emulator",
      headless: Boolean(process.env.CI),
      gpuMode: process.env.CI ? 'off' : undefined,
      device: {
        avdName: "Pixel_API_28"
      },
      utilBinaryPaths: [
        "./cache/test-butler-app.apk"
      ],
    },
    "genymotion.emulator.uuid": {
      type: "android.genycloud",
      device: {
        recipeUUID: "a50a71d6-da90-4c67-bdfa-5b602b0bbd15"
      },
      utilBinaryPaths: [
        "./cache/test-butler-app.apk"
      ],
    },
    "genymotion.emulator.name": {
      type: "android.genycloud",
      device: {
        recipeName: "Detox_Pixel_API_29"
      },
      utilBinaryPaths: [
        "./cache/test-butler-app.apk"
      ],
    }
  },
  configurations: {
    "ios.sim.release": {
      device: "simulator",
      app: "ios.release",
    },
    "android.emu.release": {
      device: "emulator",
      app: "android.release",
    },
    "android.genycloud.release": {
      device: "genymotion.emulator.uuid",
      app: "android.release",
    }
  }
};
