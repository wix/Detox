const InstrumentsArtifactPlugin = require('./artifacts/instruments/InstrumentsArtifactPlugin');
const LogArtifactPlugin = require('./artifacts/log/LogArtifactPlugin');
const ScreenshotArtifactPlugin = require('./artifacts/screenshot/ScreenshotArtifactPlugin');
const VideoArtifactPlugin = require('./artifacts/video/VideoArtifactPlugin');

const defaultArtifactsConfiguration = {
  rootDir: 'artifacts',
  pathBuilder: null,
  plugins: {
    log: 'none',
    screenshot: 'manual',
    video: 'none',
    instruments: 'none',
  },
};

const allArtifactsConfiguration = {
  rootDir: 'artifacts',
  pathBuilder: null,
  plugins: {
    log: 'all',
    screenshot: 'all',
    video: 'all',
    instruments: 'all',
  },
};

const pluginsDefaultsResolved = {
  log: LogArtifactPlugin.parseConfig('none'),
  screenshot: ScreenshotArtifactPlugin.parseConfig('manual'),
  video: VideoArtifactPlugin.parseConfig('none'),
  instruments: InstrumentsArtifactPlugin.parseConfig('none'),
};

const pluginsFailingResolved = {
  log: LogArtifactPlugin.parseConfig('failing'),
  screenshot: ScreenshotArtifactPlugin.parseConfig('failing'),
  video: VideoArtifactPlugin.parseConfig('failing'),
};

const pluginsAllResolved = {
  log: LogArtifactPlugin.parseConfig('all'),
  screenshot: ScreenshotArtifactPlugin.parseConfig('all'),
  video: VideoArtifactPlugin.parseConfig('all'),
  instruments: InstrumentsArtifactPlugin.parseConfig('all'),
};

const validOneDeviceNoSession = {
  "configurations": {
    "ios.sim.release": {
      "binaryPath": "ios/build/Build/Products/Release-iphonesimulator/example.app",
      "type": "ios.simulator",
      "name": "iPhone 7 Plus, iOS 10.2"
    }
  }
};

const validOneIosNoneDeviceNoSession = {
  "configurations": {
    "ios.none": {
      "type": "ios.none",
      "name": "iPhone 7 Plus, iOS 10.2"
    }
  }
};

const validTwoDevicesNoSession = {
  "configurations": {
    "ios.sim.release": {
      "binaryPath": "ios/build/Build/Products/Release-iphonesimulator/example.app",
      "type": "ios.simulator",
      "name": "iPhone 7 Plus, iOS 10.2"
    },
    "ios.sim.debug": {
      "binaryPath": "ios/build/Build/Products/Debug-iphonesimulator/example.app",
      "type": "ios.simulator",
      "name": "iPhone 7 Plus, iOS 10.2"
    }
  }
};

const invalidDeviceNoBinary = {
  "configurations": {
    "ios.sim.release": {
      "type": "ios.simulator",
      "name": "iPhone 7 Plus, iOS 10.2"
    }
  }
};

const invalidNoDevice = {
  "configurations": {
  }
};

const invalidDeviceNoDeviceType = {
  "configurations": {
    "ios.sim.release": {
      "binaryPath": "here",
      "name": "iPhone 7 Plus, iOS 10.2"
    }
  }
};

const invalidDeviceNoDeviceName = {
  "configurations": {
    "ios.sim.release": {
      "binaryPath": "here",
      "type": "ios.simulator"
    }
  }
};

const validOneDeviceAndSession = {
  "session": {
    "server": "ws://localhost:8099",
    "sessionId": "test"
  },
  "configurations": {
    "ios.sim.release": {
      "binaryPath": "ios/build/Build/Products/Release-iphonesimulator/example.app",
      "testBinaryPath": "some/test/path",
      "type": "ios.simulator",
      "name": "iPhone 7 Plus, iOS 10.2"
    }
  }
};

const pathsTests = {
  "session": {
    "server": "ws://localhost:8099",
    "sessionId": "test"
  },
  "configurations": {
    "absolutePath": {
      "binaryPath": process.platform === "win32" ? "C:\\Temp\\abcdef\\123" : "/tmp/abcdef/123",
      "type": "ios.simulator",
      "name": "iPhone 7 Plus, iOS 10.2"
    },
    "relativePath": {
      "binaryPath": "abcdef/123",
      "type": "ios.simulator",
      "name": "iPhone 7 Plus, iOS 10.2"
    }
  }
};

const invalidSessionNoSessionId = {
  "session": {
    "server": "ws://localhost:8099"
  }
};

const invalidSessionNoServer = {
  "session": {
    "sessionId": "test"
  }
};

const invalidOneDeviceTypeEmulatorNoSession = {
  "configurations": {
    "ios.sim.release": {
      "binaryPath": "some.apk",
      "type": "emulator",
      "name": "an emulator"
    }
  }
};

const sessionPerConfiguration = {
  "configurations": {
    "ios.sim.none": {
      "binaryPath": "ios/build/Build/Products/Release-iphonesimulator/example.app",
      "type": "ios.none",
      "name": "iPhone 7 Plus, iOS 10.2",
      "session": {
        "server": "ws://localhost:1111",
        "sessionId": "test_1111"
      }
    },
    "ios.sim.release": {
      "binaryPath": "ios/build/Build/Products/Release-iphonesimulator/example.app",
      "type": "ios.none",
      "name": "iPhone 7 Plus, iOS 10.2",
      "session": {
        "server": "ws://localhost:2222",
        "sessionId": "test_2222"
      }
    }
  }
};

const sessionInCommonAndInConfiguration = {
  "session": {
    "server": "ws://localhost:1111",
    "sessionId": "test_1"
  },
  "configurations": {
    "ios.sim.none": {
      "binaryPath": "ios/build/Build/Products/Release-iphonesimulator/example.app",
      "type": "ios.none",
      "name": "iPhone 7 Plus, iOS 10.2",
      "session": {
        "server": "ws://localhost:2222",
        "sessionId": "test_2"
      }
    }
  }
};

const validOneEmulator = {
  "configurations": {
    "android.emu.release": {
      "binaryPath": "android/app/build/outputs/apk/app-debug.apk",
      "type": "android.emulator",
      "name": "Nexus 5X"
    }
  }
};

const deviceObjectSimulator = {
  "configurations": {
    "ios.sim.release": {
      "binaryPath": "ios/build/Build/Products/Release-iphonesimulator/example.app",
      "type": "ios.simulator",
      "device": {
        "name": "iPhone 7 Plus",
        "os": "iOS 10.2"
      }
    }
  }
};

const deviceObjectEmulator = {
  "configurations": {
    "android.emu.release": {
      "binaryPath": "android/app/build/outputs/apk/app-debug.apk",
      "type": "android.emulator",
      "device": {
        "avdName": "Nexus 5X"
      }
    }
  }
};

module.exports = {
  allArtifactsConfiguration,
  defaultArtifactsConfiguration,
  pluginsAllResolved,
  pluginsDefaultsResolved,
  pluginsFailingResolved,
  validOneDeviceNoSession,
  validOneIosNoneDeviceNoSession,
  validTwoDevicesNoSession,
  invalidDeviceNoBinary,
  invalidNoDevice,
  invalidDeviceNoDeviceType,
  invalidDeviceNoDeviceName,
  validOneDeviceAndSession,
  invalidSessionNoSessionId,
  invalidSessionNoServer,
  invalidOneDeviceTypeEmulatorNoSession,
  sessionPerConfiguration,
  sessionInCommonAndInConfiguration,
  validOneEmulator,
  pathsTests,
  deviceObjectEmulator,
  deviceObjectSimulator,
};
